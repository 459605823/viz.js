import Manager from './base'

export class CacheManager extends Manager {
  readonly name = 'CacheManager'

  private cache: Record<string, any> = {}

  set(key: string, value: any) {
    this.cache[key] = value
  }

  get(key: string) {
    return this.cache[key]
  }

  has(key: string) {
    return key in this.cache
  }

  remove(key: string) {
    delete this.cache[key]
  }

  clear() {
    this.cache = {}
  }

  dispose() {
    super.dispose()
    this.clear()
  }
}
