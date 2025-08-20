export class Repository {
  #db;
  #store;

  constructor(database, store) {
    this.#db = database;
    this.#store = store;
  }

  insert(record) {
    return this.#db.transaction(this.#store, 'readwrite', (ctx) =>
      ctx.add(this.#store, record),
    );
  }

  getAll() {
    return this.#db.transaction(this.#store, 'readonly', (ctx) =>
      ctx.getAll(this.#store),
    );
  }

  get(id) {
    return this.#db.transaction(this.#store, 'readonly', (ctx) =>
      ctx.get(this.#store, id),
    );
  }

  update(record) {
    return this.#db.transaction(this.#store, 'readwrite', (ctx) =>
      ctx.put(this.#store, record),
    );
  }

  delete(id) {
    return this.#db.transaction(this.#store, 'readwrite', (ctx) =>
      ctx.delete(this.#store, id),
    );
  }

  txUpdate(id, action) {
    return this.#db.transaction(this.#store, 'readwrite', async (ctx) => {
      const record = await ctx.get(this.#store, id);
      if (!record) {
        throw new Error(
          `Record with id=${id} not found in store ${this.#store}`,
        );
      }
      const updated = action(record);
      await ctx.put(this.#store, updated);
      return updated;
    });
  }
}
