import Manager from './base';

export class DataManager extends Manager {
  readonly name = 'DataManager';

  private dataStore: Map<string, any> = new Map();
}
