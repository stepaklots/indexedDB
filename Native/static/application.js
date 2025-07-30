import { Database } from './db.js';
import { upgradeCallback } from './db-upgrade.js';

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

const dbInstance = new Database({
  dbName: 'indexedDBWrapper',
  version: 1,
  upgradeCallback,
});
const db = await dbInstance.connect();

document.getElementById('add').onclick = async () => {
  const name = prompt('Enter user name:');
  if (!name) return;
  const age = parseInt(prompt('Enter age:'), 10);
  if (!Number.isInteger(age)) return;
  await db.add('user', { name, age });
  logger.log('Added:', { name, age });
};

document.getElementById('get').onclick = async () => {
  const result = await db.getAll('user');
  logger.log('Users:', result);
};

document.getElementById('update').onclick = async () => {
  const id = parseInt(prompt('Enter id:'), 10);
  await db.transaction(['user'], 'readwrite', async (tx) => {
    const user = await tx.user.get(id);
    user.age += 1;
    await tx.user.put(user);
    logger.log('Updated:', user);
  });
};

document.getElementById('delete').onclick = async () => {
  const userId = 2;
  await db.delete('user', userId);
  logger.log(`Deleted user id[${userId}]`);
};

document.getElementById('adults').onclick = async () => {
  const adults = [];
  for await (const user of db.cursorIterator('user')) {
    if (user.age >= 18) {
      adults.push(user);
    }
  }
  logger.log('Adults:', adults);
};

document.getElementById('clear').onclick = async () => {
  await db.clear('user');
  logger.log('Deleted all');
};
