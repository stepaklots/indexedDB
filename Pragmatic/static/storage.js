class Repository {
  constructor(store, db, schema) {
    this.store = store;
    this.db = db;
    this.schema = schema;
  }

  insert(record) {
    const op = (store) => store.add(record);
    return this.db.execute(this.store, 'readwrite', op);
  }

  async select({ where, limit, offset, order } = {}) {
    const op = (store) => {
      const results = [];
      let skipped = 0;
      return new Promise((resolve, reject) => {
        const cursor = store.openCursor();
        const done = () => resolve(Repository.#order(results, order));
        cursor.onerror = () => reject(cursor.error);
        cursor.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) return void done();
          const record = cursor.value;
          if (!where || where(record)) {
            if (!offset || skipped >= offset) {
              results.push(record);
              if (limit && results.length >= limit) return void done();
            } else {
              skipped++;
            }
          }
          cursor.continue();
        };
      });
    };
    return this.db.execute(this.store, 'readonly', op);
  }

  static #order(arr, order) {
    if (!order) return arr;
    const [field, dir = 'asc'] = order.split(' ');
    const sign = dir === 'desc' ? -1 : 1;
    return [...arr].sort((a, b) => {
      if (a[field] === b[field]) return 0;
      return a[field] > b[field] ? sign : -sign;
    });
  }

  get({ id }) {
    return this.db.execute(this.store, 'readonly', (store) => {
      const req = store.get(id);
      return new Promise((resolve, reject) => {
        req.onerror = () => reject(req.error || new Error(`Can't get ${id}`));
        req.onsuccess = () => resolve(req.result);
      });
    });
  }

  update(record) {
    const op = (store) => store.put(record);
    return this.db.execute(this.store, 'readwrite', op);
  }

  delete({ id }) {
    const op = (store) => store.delete(id);
    return this.db.execute(this.store, 'readwrite', op);
  }
}

class Database {
  #name;
  #version;
  #schemas;
  #instance;
  #active = false;
  #stores = new Map();

  constructor(name, version, schemas) {
    this.#name = name;
    this.#version = version;
    this.#schemas = schemas;
    return this.#open();
  }

  async #open() {
    await this.#connect();
    await this.#init();
    return this;
  }

  async #connect() {
    this.#instance = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#name, this.#version);
      request.onupgradeneeded = (event) => this.#upgrade(event);
      request.onsuccess = (event) => {
        this.#active = true;
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(event.target.error || new Error('IndexedDB open error'));
      };
    });
  }

  #init() {
    for (const [name, schema] of Object.entries(this.#schemas)) {
      const store = new Repository(name, this, schema);
      this.#stores.set(name, store);
    }
  }

  #upgrade(event) {
    const db = event.target.result;
    for (const [name, schema] of Object.entries(this.#schemas)) {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, schema);
      }
    }
  }

  getStore(name) {
    return this.#stores.get(name);
  }

  async execute(storeName, mode, operation) {
    if (!this.#active) throw new Error('Database not connected');
    const db = this.#instance;
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const result = operation(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('Transaction error'));
      } catch (error) {
        reject(error);
      }
    });
  }
}

export { Repository, Database };
