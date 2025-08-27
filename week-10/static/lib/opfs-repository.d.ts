import { IRepository } from './i-repository';
import { IRecord } from './i-record';

export class OpfsRepository<T extends IRecord> implements IRepository<T> {
  insert(record: T): Promise<T>;
  getAll(id: string): Promise<T[]>;
  get(): Promise<T>;
  update(id: string, action: (record: T) => {}): Promise<T>;
  delete(id: string): Promise<void>;
}
