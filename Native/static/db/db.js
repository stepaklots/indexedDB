import { cursorIterator } from './cursor-iterator.js';
import { upgradeCallback } from './db-upgrade.js';
import { transactionContext } from './transaction-context.js';

const transactionModes = {
  readwrite: 'readwrite',
  readonly: 'readonly',
};

const ensureArray = (input) => Array.isArray(input) ? input : [input];

export class Database {
  #connection;
  #dbName;
  #upgradeCallback;
  #version;

  constructor({ dbName, version = 1, callback = upgradeCallback }) {
    this.#dbName = dbName;
    this.#upgradeCallback = callback;
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
      storeName,
      transactionModes.readonly,
      (context) => context.getAll(storeName),
    );
  }

  get(storeName, id) {
    return this.transaction(
      storeName,
      transactionModes.readonly,
      (context) => context.get(storeName, id),
    );
  }

  add(storeName, record) {
    return this.transaction(
      storeName,
      transactionModes.readwrite,
      (context) => context.add(storeName, record),
    );
  }

  put(storeName, record) {
    return this.transaction(
      storeName,
      transactionModes.readwrite,
      (context) => context.put(storeName, record),
    );
  }

  delete(storeName, id) {
    return this.transaction(
      storeName,
      transactionModes.readwrite,
      (context) => context.delete(storeName, id),
    );
  }

  clear(storeName) {
    return this.transaction(
      storeName,
      transactionModes.readwrite,
      (context) => context.clear(storeName),
    );
  }
}
