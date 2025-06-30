class Repository {
  constructor(db, store) {
    this.db = db;
    this.store = store;
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
    const [field, dir] = order.split(' ');
    const sign = dir === 'desc' ? -1 : 1;
    return [...arr].sort((a, b) => (a[field] > b[field] ? 1 : -1) * sign);
  }

  get({ id }) {
    return this.db.execute(this.store, 'readonly', (store) => {
      const req = store.get(id);
      return new Promise((resolve, reject) => {
        req.onerror = () => reject(req.error || new Error(`Cen't get ${id}`));
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
  #entities;
  #instance;
  #active = false;
  #repositories = new Map();

  constructor(name, version, entities) {
    this.#name = name;
    this.#version = version;
    this.#entities = entities;
    return this.#connect();
  }

  async #connect() {
    this.#instance = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#name, this.#version);
      request.onupgradeneeded = (event) => this.#upgrade(event);
      request.onsuccess = () => {
        this.#active = true;
        resolve(request.result);
      };
      request.onerror = () =>
        reject(request.error || new Error('IndexedDB open error'));
    });
    for (const { name } of this.#entities) {
      this.#repositories.set(name, new Repository(this, name));
    }
    return this;
  }

  #upgrade(event) {
    const db = event.target.result;
    for (const { name, options } of this.#entities) {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, options);
      }
    }
  }

  getRepo(name) {
    return this.#repositories.get(name);
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
