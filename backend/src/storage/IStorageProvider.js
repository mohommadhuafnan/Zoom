/**
 * Storage abstraction — swap LocalDiskStorage for S3Storage in production.
 */
export class IStorageProvider {
  async save(_file, _filename) {
    throw new Error('Not implemented');
  }

  async get(_filename) {
    throw new Error('Not implemented');
  }

  async delete(_filename) {
    throw new Error('Not implemented');
  }

  getUrl(_filename) {
    throw new Error('Not implemented');
  }
}
