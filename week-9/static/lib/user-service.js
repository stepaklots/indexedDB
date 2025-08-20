const userStore = 'user';

export class UserService {
  #repository;
  #logger;

  constructor(repository, logger) {
    this.#repository = repository;
    this.#logger = logger;
  }

  async create() {
    const name = prompt('Enter user name:');
    const age = parseInt(prompt('Enter age:'), 10);
    const user = { name, age };
    this.#validate(user);
    await this.#repository.insert({ store: userStore, record: user });
    this.#logger.log('Added:', user);
  }

  async findAll() {
    const users = await this.#repository.getAll({ store: userStore });
    this.#logger.log('Users:', users);
  }

  async incrementAge(id) {
    const user = await this.#repository.txUpdate({
      store: userStore,
      id,
      action: (user) => {
        user.age += 1;
        return user;
      },
    });
    this.#logger.log('Updated:', user);
  }

  async delete(id) {
    await this.#repository.delete({ store: userStore, id });
    this.#logger.log('Deleted user with id=2');
  }

  async findAdults() {
    const users = await this.#repository.getAll({ store: userStore });
    const adults = users.filter((user) => user.age >= 18);
    this.#logger.log('Adults:', adults);
  }

  #validate(user) {
    if (typeof user.name !== 'string' || user.name.trim().length === 0) {
      throw new Error('Invalid name');
    }
    if (!Number.isInteger(user.age) || user.age < 0) {
      throw new Error('Invalid age');
    }
    user.name = user.name.trim();
  }
}
