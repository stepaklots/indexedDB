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

class UserRepository {
  #db;
  #store;

  constructor(db, store = 'users') {
    this.#db = db;
    this.#store = store;
  }

  async insert(user) {
    return this.#db.run(this.#store, 'readwrite', async (store) => {
      store.add(user);
    });
  }

  async select() {
    return this.#db.run(this.#store, 'readonly', async (store) => {
      const req = store.getAll();
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result);
      });
    });
  }

  async get(id) {
    return this.#db.run(this.#store, 'readonly', async (store) => {
      const req = store.get(id);
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result);
      });
    });
  }

  async update(user) {
    return this.#db.run(this.#store, 'readwrite', async (store) => {
      store.put(user);
    });
  }

  async delete(id) {
    return this.#db.run(this.#store, 'readwrite', async (store) => {
      store.delete(id);
    });
  }
}

class UserService {
  #repo;
  #logger;

  constructor(repo, logger) {
    this.#repo = repo;
    this.#logger = logger;
  }

  async insert(user) {
    await this.#repo.insert(user);
    const record = JSON.stringify(user, null, 2);
    this.#logger.log(`Added: ${record}`);
  }

  async read() {
    const users = await this.#repo.select();
    const data = JSON.stringify(users, null, 2);
    this.#logger.log(`Users:\n${data}`);
  }

  async update({ id, update }) {
    const user = await this.#repo.get(id);
    if (user) {
      await update(user);
      await this.#repo.update(user);
      const record = JSON.stringify(user, null, 2);
      this.#logger.log(`Updated:\n${record}`);
    } else {
      this.#logger.log(`User with id=${id} not found`);
    }
  }

  async delete({ id }) {
    await this.#repo.delete(id);
    this.#logger.log(`Deleted user with id=${id}`);
  }
}

const entities = [
  { name: 'users', options: { keyPath: 'id', autoIncrement: true } },
];

const logger = new Logger('output');
const db = new Database('Example', 1, entities);
const repo = new UserRepository(db);
const service = new UserService(repo, logger);

document.getElementById('add').onclick = () => {
  const name = prompt('Enter user name:');
  const age = parseInt(prompt('Enter age:'), 10);
  if (!name || !Number.isInteger(age)) return;
  service.insert({ name, age });
};

document.getElementById('get').onclick = () => service.read();

document.getElementById('update').onclick = () => {
  service.update({
    id: 1,
    update: async (user) => {
      user.age += 1;
    },
  });
};

document.getElementById('delete').onclick = () => {
  service.delete({ id: 2 });
};
