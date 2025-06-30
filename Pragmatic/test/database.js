import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { Database } from '../static/storage.js';

test('Database connects and exposes repository', async () => {
  const entities = {
    user: { keyPath: 'id', autoIncrement: true },
  };
  const db = await new Database('TestDatabase', 1, entities);
  const user = db.getStore('user');
  assert.ok(user);
});
