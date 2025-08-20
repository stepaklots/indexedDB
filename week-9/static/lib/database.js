import { transactionContext } from './transaction-context.js';

export class Database {
  #name;
  #version;
  #schemas;
  #instance = null;

  constructor(name, { version = 1, schemas = {} } = {}) {
    this.#name = name;
    this.#version = version;
    this.#schemas = schemas;
    return this.#open();
  }

  async #open() {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#name, this.#version);
      request.onupgradeneeded = (event) => this.#upgrade(event.target.result);
      request.onsuccess = (event) => {
        this.#instance = event.target.result;
        resolve();
      };
      request.onerror = (event) => {
        let { error } = event.target;
        if (!error) error = new Error(`IndexedDB: can't open ${this.#name}`);
        reject(error);
      };
    });
    return this;
  }

  #upgrade(db) {
    for (const [name, schema] of Object.entries(this.#schemas)) {
      if (!db.objectStoreNames.contains(name)) {
        const options = { keyPath: 'id', autoIncrement: true };
        const store = db.createObjectStore(name, options);
        for (const [field, def] of Object.entries(schema)) {
          if (name !== 'id' && def.index) {
            store.createIndex(field, field, { unique: false });
          }
        }
      }
    }
  }

  transaction(storeNames, mode, callback) {
    if (!this.#instance) {
      return Promise.reject(new Error('Database not initialized'));
    }
    const tx = this.#instance.transaction(storeNames, mode);
    const context = transactionContext(tx);
    return new Promise((resolve, reject) => {
      try {
        const result = callback(context);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
}
