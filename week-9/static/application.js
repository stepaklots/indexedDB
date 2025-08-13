import { Storage } from './lib/storage.js';
import { Database } from './lib/database.js';
import { Logger } from './lib/logger.js';
import { dbValidate } from './lib/db-validate.js';

const logger = new Logger('output');
const schemas = {
  user: {
    id: { type: 'int', primary: true },
    name: { type: 'str', index: true },
    age: { type: 'int' },
  },
};
const db = await new Database('Example', { version: 1, schemas });
const storage = new Storage(db, dbValidate(schemas));

const actions = {
  add: async () => {
    const name = prompt('Enter user name:');
    const age = parseInt(prompt('Enter age:'), 10);
    const user = { name, age };
    await storage.save('user', user);
    logger.log('Added:', user);
  },

  get: async () => {
    const users = await storage.findAll('user');
    logger.log('Users:', users);
  },

  update: async () => {
    const user = await storage.find('user', 1);
    if (user) {
      user.age += 1;
      await storage.update('user', user);
      logger.log('Updated:', user);
    } else {
      logger.log('User with id=1 not found');
    }
  },

  delete: async () => {
    await storage.delete('user', 2);
    logger.log('Deleted user with id=2');
  },

  adults: async () => {
    const users = await storage.select({
      store: 'user',
      filter: (user) => user.age >= 18,
      order: { name: 'asc' },
      limit: 10,
    });
    logger.log('Adults:', users);
  },
};

const action = (id, handler) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.onclick = () => {
    handler().catch((error) => {
      logger.log(error.message);
    });
  };
};

for (const [id, handler] of Object.entries(actions)) {
  action(id, handler);
}
