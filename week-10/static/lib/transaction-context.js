const promisify = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const transactionContext = (tx) => ({
  add: (storeName, record) => promisify(tx.objectStore(storeName).add(record)),
  put: (storeName, record) => promisify(tx.objectStore(storeName).put(record)),
  get: (storeName, id) => promisify(tx.objectStore(storeName).get(id)),
  getAll: (storeName) => promisify(tx.objectStore(storeName).getAll()),
  delete: (storeName, id) => promisify(tx.objectStore(storeName).delete(id)),
  count: (storeName) => promisify(tx.objectStore(storeName).count()),
  clear: (storeName) => promisify(tx.objectStore(storeName).clear()),
  abort: () => tx.abort(),
  commit: () => tx.commit(),
});
