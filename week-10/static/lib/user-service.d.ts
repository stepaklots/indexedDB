import { Logger } from './logger';
import { IRepository } from './i-repository';
import { UserRecord } from './user-record';

export class UserService {
  constructor(
    repository: IRepository<UserRecord>,
    logger: Logger,
  );

  create(): Promise<void>;
  findAll(): Promise<void>;
  incrementAge(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  findAdults(): Promise<void>;
}
