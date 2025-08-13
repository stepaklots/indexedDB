export class Storage {
  #db;
  #validateFn;

  constructor(db, validateFn) {
    this.#db = db;
    this.#validateFn = validateFn;
  }

  async save(store, record) {
    this.#validateFn({ store, record });
    return this.#db.exec(store, (objectStore) => objectStore.add(record));
  }

  async findAll(store) {
    return this.select({ store });
  }

  async find(store, id) {
    const op = (objectStore) => {
      const req = objectStore.get(id);
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error(`Can't get ${id}`));
      });
    };
    return this.#db.exec(store, op, 'readonly');
  }

  async update(store, record) {
    this.#validateFn({ store, record });
    return this.#db.exec(store, (objectStore) => objectStore.put(record));
  }

  async delete(store, id) {
    return this.#db.exec(store, (objectStore) => objectStore.delete(id));
  }

  select({ store, where, limit, offset, order, filter, sort }) {
    const op = (objectStore) => {
      const result = [];
      let skipped = 0;
      return new Promise((resolve, reject) => {
        const reply = () => {
          if (sort) result.sort(sort);
          if (order) this.#sort(result, order);
          resolve(result);
        };
        const req = objectStore.openCursor();
        req.onerror = () => reject(req.error);
        req.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) return void reply();
          const record = cursor.value;
          const check = ([key, val]) => record[key] === val;
          const match = !where || Object.entries(where).every(check);
          const valid = !filter || filter(record);
          if (match && valid) {
            if (!offset || skipped >= offset) result.push(record);
            else skipped++;
            if (limit && result.length >= limit) return void reply();
          }
          cursor.continue();
        };
      });
    };
    return this.#db.exec(store, op, 'readonly');
  }

  #sort(arr, order) {
    if (typeof order !== 'object') return;
    const rule = Object.entries(order)[0];
    if (!Array.isArray(rule)) return;
    const [field, dir = 'asc'] = rule;
    const sign = dir === 'desc' ? -1 : 1;
    arr.sort((a, b) => {
      const x = a[field];
      const y = b[field];
      if (x === y) return 0;
      return x > y ? sign : -sign;
    });
  }
}
