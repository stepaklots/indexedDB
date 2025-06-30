import { Database } from './storage.js';

class Logger {
  #output;

  constructor(outputId) {
    this.#output = document.getElementById(outputId);
  }

  log(...args) {
    const lines = args.map(Logger.#serialize);
    this.#output.textContent += lines.join(' ') + '\n';
    this.#output.scrollTop = this.#output.scrollHeight;
  }

  static #serialize(x) {
    return typeof x === 'object' ? JSON.stringify(x, null, 2) : x;
  }
}

const logger = new Logger('output');
const schemas = {
  user: { keyPath: 'id', autoIncrement: true },
};
const db = await new Database('Example', 1, schemas);
const repo = db.getStore('user');

const actions = {
  add: async () => {
    const name = prompt('Enter user name:');
    if (!name) return;
    const age = parseInt(prompt('Enter age:'), 10);
    if (!Number.isInteger(age)) return;
    const user = { name, age };
    await repo.insert(user);
    logger.log('Added:', user);
  },

  get: async () => {
    const users = await repo.select();
    logger.log('Users:', users);
  },

  update: async () => {
    const user = await repo.get({ id: 1 });
    if (user) {
      user.age += 1;
      await repo.update(user);
      logger.log('Updated:', user);
    } else {
      logger.log('User with id=1 not found');
    }
  },

  delete: async () => {
    await repo.delete({ id: 2 });
    logger.log('Deleted user with id=2');
  },

  adults: async () => {
    const users = await repo.select({
      where: (user) => user.age >= 18,
      order: 'name asc',
      limit: 10,
    });
    logger.log('Adults:', users);
  },
};

const init = () => {
  for (const [id, handler] of Object.entries(actions)) {
    const element = document.getElementById(id);
    if (element) element.onclick = handler;
  }
};

init();
