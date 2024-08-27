import mitt from 'mitt';
import Manager from './base';

export class EventManager extends Manager {
  readonly name = 'EventManager';

  private emitter = mitt();

  constructor() {
    super();
  }

  on(type: string, handler: (args: any) => void) {
    this.emitter.on(type, handler);
  }

  off(type: string, handler: (args: any) => void) {
    this.emitter.off(type, handler);
  }

  emit(type: string, args: any) {
    this.emitter.emit(type, args);
  }

  dispose(): void {
    this.emitter.all.clear();
    super.dispose();
  }
}
