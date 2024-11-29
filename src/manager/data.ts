import Manager from './base';

export class DataManager extends Manager {
  readonly name = 'DataManager';

  private dataStore: Map<string, {value: any; effect?: () => void}> = new Map();

  setData(key: string, data: any, effect?: () => void) {
    this.dataStore.set(key, {value: data, effect});
    this.dataStore.get(key)?.effect?.();
  }

  getData(key: string) {
    return this.dataStore.get(key);
  }

  dispose() {
    super.dispose();
    this.dataStore.clear();
  }
}
