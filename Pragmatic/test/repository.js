import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { Database } from '../static/storage.js';

test('Repository performs basic CRUD', async () => {
  const schemas = {
    user: { keyPath: 'id', autoIncrement: true },
  };
  const db = await new Database('TestDatabase', 1, schemas);
  const user = db.getStore('user');

  await user.insert({ name: 'Alice', age: 30 });
  await user.insert({ name: 'Bob', age: 20 });

  const users = await user.select();
  assert.equal(users.length, 2);

  const record = await user.get({ id: 1 });
  assert.equal(record.name, 'Alice');

  record.age++;
  await user.update(record);

  const updated = await user.get({ id: 1 });
  assert.equal(updated.age, 31);

  await user.delete({ id: 2 });
  const remaining = await user.select();
  assert.equal(remaining.length, 1);
});
