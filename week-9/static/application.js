import { Database } from './lib/database.js';
import { Logger } from './lib/logger.js';
import { Repository } from './lib/repository.js';
import { UserService } from './lib/user-service.js';

const logger = new Logger('output');
const schemas = {
  user: {
    id: { type: 'int', primary: true },
    name: { type: 'str', index: true },
    age: { type: 'int' },
  },
};
const db = await new Database('Demo', { version: 1, schemas });
const repository = new Repository(db);
const userService = new UserService(repository, logger);

const action = (id, handler) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.onclick = () => {
    handler().catch((error) => {
      console.error(error);
      logger.log(error.message);
    });
  };
};

action('add', async () => await userService.create());
action('get', async () => await userService.findAll());
action('update', async () => await userService.incrementAge(1));
action('delete', async () => await userService.delete(2));
action('adults', async () => await userService.findAdults());
