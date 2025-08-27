export class OpfsRepository {
  #root;
  constructor(root) {
    this.#root = root;
  }

  async insert(record) {
    try {
      return await this.#writeRecord(record);
    } catch (e) {
      const error = new Error('Unable to create new file');
      error.cause = e;
      throw error;
    }
  }

  async getAll() {
    try {
      const files = await this.#getAllFiles();
      const records = [];
      for (const file of files) {
        const record = await this.#getRecord(file.name);
        records.push(record);
      }
      return records;
    } catch (e) {
      const error = new Error(`Unable to read all files`);
      error.cause = e;
      throw error;
    }
  }

  async get(id) {
    try {
      return this.#getRecord(id);
    } catch (e) {
      const error = new Error(`Unable to get file '${id}'`);
      error.cause = e;
      throw error;
    }
  }

  async update(id, action) {
    try {
      const record = this.#getRecord(id);
      const updated = action(record);
      await this.#writeRecord(updated);
      return record;
    } catch (e) {
      const error = new Error(`Unable to update file '${id}'`);
      error.cause = e;
      throw error;
    }
  }

  async delete(id) {
    try {
      return await this.#root.removeEntry(id);
    } catch (e) {
      const error = new Error(`Unable to delete file '${id}'`);
      error.cause = e;
      throw error;
    }
  }

  #createFile(name) {
    try {
      return this.#root.getFileHandle(name, { create: true });
    } catch (e) {
      const error = new Error(`Unable to create file '${name}'`);
      error.cause = e;
      throw error;
    }
  }

  async #getAllFiles() {
    const files = [];
    for await (const entry of this.#root.values()) {
      if (entry.kind === 'file') {
        files.push(entry);
      }
    }
    return files;
  }

  async #getNextId() {
    const files = await this.#getAllFiles();
    const lastId = files
      .map((file) => parseInt(file.name))
      .sort((a, b) => a - b)
      .pop();
    console.log(`lastId: ${lastId}`);
    if (lastId) {
      return (lastId + 1).toString();
    }
    return '1';
  }

  #getFileHandle(id) {
    try {
      return this.#root.getFileHandle(id);
    } catch (e) {
      const error = new Error(`Unable to get file handle for '${id}'`);
      error.cause = e;
      throw error;
    }
  }

  async #getRecord(id) {
    const fileHandle = await this.#getFileHandle(id);
    const file = await fileHandle.getFile();
    const rawContent = await file.text();
    return JSON.parse(rawContent);
  }

  async #writeRecord(record) {
    if (!record.id) {
      record.id = await this.#getNextId();
      await this.#createFile(record.id);
    }
    const fileHandle = await this.#getFileHandle(record.id);
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(record));
    await writable.close();
    return record;
  }
}
