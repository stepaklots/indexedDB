import { IRepository } from './i-repository';

export class IndexedDBRepository<IRecord> implements IRepository<IRecord> {
  insert(record: IRecord): Promise<IRecord>;
  getAll(id: string): Promise<IRecord[]>;
  get(): Promise<IRecord>;
  update(id: string, action: (record: IRecord) => {}): Promise<IRecord>;
  delete(id: string): Promise<void>;
}
