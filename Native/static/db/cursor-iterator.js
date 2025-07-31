export const cursorIterator = (request) => ({
  [Symbol.asyncIterator]() {
    return {
      next() {
        return new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              const value = cursor.value;
              cursor.continue();
              resolve({ value, done: false });
            } else {
              resolve({ done: true });
            }
          };
          request.onerror = () => reject(request.error);
        });
      },
    };
  },
});
