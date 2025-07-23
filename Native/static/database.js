const TransactionMode = {
  READ_ONLY: 'readonly',
  READ_WRITE: 'readwrite',
};

export class Database {
  #connection;
  #dbName;
  #storeName;
  #version;

  constructor({ dbName, storeName, version }) {
    this.#dbName = dbName;
    this.#storeName = storeName;
    this.#version = version;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#dbName, this.#version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.#storeName)) {
          db.createObjectStore(this.#storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = () => {
        this.#connection = request.result;
        resolve(this);
      };
      request.onerror = () => reject(request.error);
    });
  }

  #transaction(mode) {
    if (!this.#connection) {
      console.error('Database connection is not established');
    }
    const tx = this.#connection.transaction(this.#storeName, mode);
    return tx.objectStore(this.#storeName);
  }

  #execute(mode, operation) {
    return new Promise((resolve, reject) => {
      try {
        const store = this.#transaction(mode);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  #cursor(callback) {
    return new Promise((resolve, reject) => {
      try {
        const store = this.#transaction(TransactionMode.READ_ONLY);
        const request = store.openCursor();
        const results = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve(results);
            return;
          }
          if (!callback || callback(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  create(data) {
    return this.#execute(TransactionMode.READ_WRITE, (store) =>
      store.add(data),
    );
  }

  get(id) {
    return this.#execute(TransactionMode.READ_ONLY, (store) => store.get(id));
  }

  getAll() {
    return this.#execute(TransactionMode.READ_ONLY, (store) => store.getAll());
  }

  update(data) {
    return this.#execute(TransactionMode.READ_WRITE, (store) =>
      store.put(data),
    );
  }

  updateById(id, callback) {
    return this.#execute(TransactionMode.READ_ONLY, (store) =>
      store.get(id),
    ).then((data) => {
      if (!data) throw new Error(`Record with id ${id} not found`);
      const updatedData = callback(data);
      return this.#execute(TransactionMode.READ_WRITE, (store) =>
        store.put(updatedData),
      );
    });
  }

  delete(id) {
    return this.#execute(TransactionMode.READ_WRITE, (store) =>
      store.delete(id),
    );
  }

  deleteAll() {
    return this.#execute(TransactionMode.READ_WRITE, (store) =>
      store.clear(),
    );
  }

  findBy(filter) {
    return this.#cursor(filter);
  }
}
