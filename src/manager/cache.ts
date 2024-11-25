import Manager from './base';

export class CacheManager extends Manager {
  readonly name = 'CacheManager';

  private cache: Map<string, any> = new Map();

  set(key: string, value: any) {
    this.cache.set(key, value);
  }

  get<T = any>(key: string) {
    return this.cache.get(key) as T;
  }

  has(key: string) {
    return this.cache.has(key);
  }

  remove(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  dispose() {
    super.dispose();
    this.clear();
  }
}
