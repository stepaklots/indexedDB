import { cursorIterator } from './cursor-iterator.js';

const transactionModes = {
  readwrite: 'readwrite',
  readonly: 'readonly',
};

const ensureArray = (input) => Array.isArray(input) ? input : [input];

const promisify = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });


export class Database {
  #connection;
  #dbName;
  #upgradeCallback;
  #version;

  constructor({ dbName, version = 1, upgradeCallback = (db) => {} }) {
    this.#dbName = dbName;
    this.#upgradeCallback = upgradeCallback;
    this.#version = version;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#dbName, this.#version);

      request.onupgradeneeded = () => {
        const db = request.result;
        this.#upgradeCallback(db);
      };

      request.onsuccess = () => {
        this.#connection = request.result;
        resolve(this);
      };
      request.onerror = () => reject(request.error);
    });
  }

  transaction(storeNames, mode, callback) {
    const tx = this.#connection.transaction(storeNames, mode);
    const context = {};
    storeNames = ensureArray(storeNames);
    for (const storeName of storeNames) {
      const store = tx.objectStore(storeName);
      context[storeName] = {
        add: (record) => promisify(store.add(record)),
        put: (record) => promisify(store.put(record)),
        get: (id) => promisify(store.get(id)),
        getAll: () => promisify(store.getAll()),
        delete: (id) => promisify(store.delete(id)),
        count: () => promisify(store.count()),
        clear: () => promisify(store.clear()),
      };
    }

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

  cursorIterator(storeName) {
    const tx = this.#connection.transaction(
      storeName,
      transactionModes.readonly,
    );
    const store = tx.objectStore(storeName);
    const request = store.openCursor();
    return cursorIterator(request);
  }

  getAll(storeName) {
    return this.transaction(
      [storeName],
      transactionModes.readonly,
      (context) => context[storeName].getAll(),
    );
  }

  get(storeName, id) {
    return this.transaction(
      [storeName],
      transactionModes.readonly,
      (context) => context[storeName].get(id),
    );
  }

  add(storeName, record) {
    return this.transaction(
      [storeName],
      transactionModes.readwrite,
      (context) => context[storeName].add(record),
    );
  }

  put(storeName, record) {
    return this.transaction(
      [storeName],
      transactionModes.readwrite,
      (context) => context[storeName].put(record),
    );
  }

  delete(storeName, id) {
    return this.transaction(
      [storeName],
      transactionModes.readwrite,
      (context) => context[storeName].delete(id),
    );
  }

  clear(storeName) {
    return this.transaction(
      [storeName],
      transactionModes.readwrite,
      (context) => context[storeName].clear(),
    );
  }
}
