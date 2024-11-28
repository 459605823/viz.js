import Manager from './base';

export class DataManager extends Manager {
  readonly name = 'DataManager';

  private dataStore: Map<string, any> = new Map();

  setData(key: string, data: any) {
    this.dataStore.set(key, data);
  }

  getData(key: string) {
    return this.dataStore.get(key);
  }
}
