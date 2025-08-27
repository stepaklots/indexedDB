import { IRecord } from './i-record';

export class UserRecord implements IRecord {
  id: string;
  name: string;
  age: number;
}
