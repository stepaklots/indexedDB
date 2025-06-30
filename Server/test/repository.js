import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { Database } from '../static/storage.js';

test('Repository performs basic CRUD', async () => {
  const entities = [
    { name: 'user', options: { keyPath: 'id', autoIncrement: true } }
  ];
  const db = await new Database('TestDatabase', 1, entities);

  const repo = db.getRepo('user');

  await repo.insert({ name: 'Alice', age: 30 });
  await repo.insert({ name: 'Bob', age: 20 });

  const users = await repo.select();
  assert.equal(users.length, 2);

  const user = await repo.get({ id: 1 });
  assert.equal(user.name, 'Alice');

  user.age++;
  await repo.update(user);

  const updated = await repo.get({ id: 1 });
  assert.equal(updated.age, 31);

  await repo.delete({ id: 2 });
  const remaining = await repo.select();
  assert.equal(remaining.length, 1);
});
