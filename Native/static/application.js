import { Database } from './database.js';

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

const db = await new Database({
  dbName: 'indexedDBWrapper',
  storeName: 'user',
  version: 1,
}).connect();

document.getElementById('add').onclick = async () => {
  const name = prompt('Enter user name:');
  if (!name) return;
  const age = parseInt(prompt('Enter age:'), 10);
  if (!Number.isInteger(age)) return;
  db.create({ name, age })
    .then(() => logger.log('Added:', { name, age }))
    .catch((error) => logger.log('Add failed', error));
};

document.getElementById('get').onclick = () => {
  db.getAll()
    .then((result) => logger.log('Users:', result))
    .catch((error) => logger.log('Get failed', error));
};

document.getElementById('update').onclick = () => {
  db.updateById(1, (user) => {
    user.age += 1;
    return user;
  })
    .then((result) => logger.log('Updated:', result))
    .catch((error) => logger.log('Update failed', error));
};

document.getElementById('delete').onclick = () => {
  const userId = 2;
  db.delete(userId)
    .then(() => logger.log(`Deleted user id[${userId}]`))
    .catch((error) => logger.log('Delete failed', error));
};

document.getElementById('adults').onclick = () => {
  db.findBy((user) => user.age >= 18)
    .then((result) => logger.log('Adults:', result))
    .catch((error) => logger.log('Adults query failed', error));
};

document.getElementById('clear').onclick = () => {
  db.deleteAll()
    .then(() => logger.log('Deleted all'))
    .catch((error) => logger.log('Deleted all failed', error));
};
