import { fsRoot } from './fs-root.js';

export class FileSystemApi {
  constructor(root) {
    this.root = root;
  }

  static async init(mode) {
    let root;
    try {
      root = await fsRoot(mode);
    } catch (e) {
      const error = new Error('Unable to access file system');
      error.cause = e;
      throw error;
    }
    return new FileSystemApi(root);
  }

  async list() {
    if (!this.root || !this.root.values) {
      throw new Error('File system not initialized');
    }
    const entries = [];
    for await (const file of this.root.values()) {
      entries.push(file);
    }
    return entries;
  }

  async create(name) {
    this.#checkNotEmpty('File name', name);
    try {
      return await this.root.getFileHandle(name, { create: true });
    } catch (e) {
      const error = new Error(`Unable to create file '${name}'`);
      error.cause = e;
      throw error;
    }
  }

  async write(name, content) {
    try {
      const fileHandle = await this.create(name);
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (e) {
      const error = new Error(`Unable to write to file '${name}'`);
      error.cause = e;
      throw error;
    }
  }

  async delete(name) {
    this.#checkNotEmpty('File name', name);
    try {
      const fileHandle = await this.root.getFileHandle(name);
      await fileHandle.remove();
    } catch (e) {
      const error = new Error(`Unable to delete file '${name}'`);
      error.cause = e;
      throw error;
    }
  }

  async deleteDir(name) {
    this.#checkNotEmpty('Dir name', name);
    try {
      const dirHandle = await this.root.getDirectoryHandle(name);
      await dirHandle.remove();
    } catch (e) {
      const error = new Error(`Unable to delete directory '${name}'`);
      error.cause = e;
      throw error;
    }
  }

  async createDir(name) {
    this.#checkNotEmpty('Dir name', name);
    try {
      await this.root.getDirectoryHandle(name, { create: true });
    } catch (e) {
      const error = new Error(`Unable to create directory '${name}'`);
      error.cause = e;
      throw error;
    }
  }

  #checkNotEmpty(name, value) {
    if (value === null || value === undefined || value.trim() === '') {
      throw new Error(`'${name}' is empty`);
    }
  }
}
