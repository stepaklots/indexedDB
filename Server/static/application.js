class Logger {
  #output;

  constructor(outputId) {
    this.#output = document.getElementById(outputId);
  }

  log(...args) {
    this.#output.textContent += args.join(' ') + '\n';
  }
}

class Database {
  #name;
  #version;
  #stores;
  #instance;

  constructor(name, version, stores) {
    this.#name = name;
    this.#version = version;
    this.#stores = stores;
  }

  async connect() {
    if (this.#instance) return this.#instance;
    this.#instance = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#name, this.#version);
      console.log(request);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const { name, options } of this.#stores) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, options);
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.#instance;
  }

  async run(storeName, mode, operation) {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      console.log({ storeName, mode, operation });
      const tx = db.transaction(storeName, mode);
      let data = null;
      tx.oncomplete = () => resolve(data);
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(storeName);
      operation(store).then((res) => {
        data = res;
      });
    });
  }
}

class Repository {
  #db;
  #store;

  constructor(db, store) {
    this.#db = db;
    this.#store = store;
  }

  insert(record) {
    return this.#db.run(this.#store, 'readwrite', async (store) => {
      store.add(record);
    });
  }

  select() {
    return this.#db.run(this.#store, 'readonly', async (store) => {
      const req = store.getAll();
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result);
      });
    });
  }

  get({ id }) {
    return this.#db.run(this.#store, 'readonly', async (store) => {
      const req = store.get(id);
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result);
      });
    });
  }

  update(record) {
    return this.#db.run(this.#store, 'readwrite', async (store) => {
      store.put(record);
    });
  }

  delete({ id }) {
    return this.#db.run(this.#store, 'readwrite', async (store) => {
      store.delete(id);
    });
  }
}

const entities = [
  { name: 'user', options: { keyPath: 'id', autoIncrement: true } },
];

const logger = new Logger('output');
const db = new Database('Example', 1, entities);
const repo = new Repository(db, 'user');

const actions = {
  add: async () => {
    const name = prompt('Enter user name:');
    if (!name) return;
    const age = parseInt(prompt('Enter age:'), 10);
    if (!Number.isInteger(age)) return;
    const user = { name, age };
    await repo.insert(user);
    const record = JSON.stringify(user, null, 2);
    logger.log(`Added: ${record}`);
  },
  get: async () => {
    const users = await repo.select();
    const data = JSON.stringify(users, null, 2);
    logger.log(`Users:\n${data}`);
  },
  update: async () => {
    const id = 1;
    const user = await repo.get({ id });
    if (user) {
      user.age += 1;
      await repo.update(user);
      const record = JSON.stringify(user, null, 2);
      logger.log(`Updated:\n${record}`);
    } else {
      logger.log(`User with id=${id} not found`);
    }
  },
  delete: async () => {
    const id = 2;
    await repo.delete({ id });
    logger.log(`Deleted user with id=${id}`);
  },
};

const init = () => {
  for (const [id, handler] of Object.entries(actions)) {
    document.getElementById(id).onclick = handler;
  }
};

init();
