export class Repository {
  #db;

  constructor(database) {
    this.#db = database;
  }

  insert({ store, record }) {
    return this.#db.transaction(store, 'readwrite', (ctx) =>
      ctx.add(store, record));
  }

  getAll({ store }) {
    return this.#db.transaction(store, 'readonly', (ctx) =>
      ctx.getAll(store));
  }

  get({ store, id }) {
    return this.#db.transaction(store, 'readonly', (ctx) =>
      ctx.get(store, id));
  }

  update({ store, record }) {
    return this.#db.transaction(store, 'readwrite', (ctx) =>
      ctx.put(store, record),
    );
  }

  delete({ store, id }) {
    return this.#db.transaction(store, 'readwrite', (ctx) =>
      ctx.delete(store, id));
  }

  txUpdate({ store, id, action }) {
    return this.#db.transaction(store, 'readwrite', async (ctx) => {
      const record = await ctx.get(store, id);
      if (!record) {
        throw new Error(`Record with id=${id} not found in store ${store}`);
      }
      const updated = action(record);
      await ctx.put(store, updated);
    });
  }
}
