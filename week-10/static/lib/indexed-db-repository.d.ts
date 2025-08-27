import { IRepository } from './i-repository';
import { IRecord } from './i-record';
import { Database } from './database.js';

export class IndexedDBRepository<T extends IRecord> implements IRepository<IRecord> {
  constructor(database: Database, store: string);

  insert(record: T): Promise<T>;
  getAll(id: string): Promise<T[]>;
  get(): Promise<T>;
  update(id: string, action: (record: T) => {}): Promise<T>;
  delete(id: string): Promise<void>;
}
