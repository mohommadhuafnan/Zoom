import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { IStorageProvider } from './IStorageProvider.js';

export class LocalDiskStorage extends IStorageProvider {
  constructor(basePath = env.storagePath) {
    super();
    this.basePath = basePath;
  }

  async ensureDir() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async save(buffer, filename) {
    await this.ensureDir();
    const filePath = path.join(this.basePath, filename);
    await fs.writeFile(filePath, buffer);
    return filename;
  }

  async get(filename) {
    const filePath = path.join(this.basePath, filename);
    return fs.readFile(filePath);
  }

  async delete(filename) {
    const filePath = path.join(this.basePath, filename);
    await fs.unlink(filePath).catch(() => {});
  }

  getUrl(filename) {
    return `/api/files/${filename}`;
  }
}

export const storage = new LocalDiskStorage();
