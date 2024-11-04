/**
 * ListenerEvent designates the format of data sent by EventDispatcher
 *
 * target: source of emitter, set upon dispatch
 * type: 'name' of the event
 * message: any content you want to pass
 */
export interface ListenerEvent {
  target?: EventDispatcher;
  type: string;
  message?: any;
}

/**
 * Callback function to process event when EventDispatcher receives one
 */
type ListenerEventLambda = ((event: ListenerEvent) => any);

export class EventDispatcher {
  /**
   * _listeners indexes a record of all callback functions
   */
  public _listeners?: {
    [index: string]: ListenerEventLambda[];
  };

  addEventListener(type: string, listener: ListenerEventLambda) {
    if (this._listeners === undefined)
      this._listeners = {};

    const listeners = this._listeners;

    if (listeners[type] === undefined) {
      listeners[type] = [];
    }

    if (!listeners[type].includes(listener)) {
      listeners[type].push(listener);
    }
  }

  hasEventListener(type: string, listener: ListenerEventLambda) {
    if (this._listeners === undefined)
      return false;

    const listeners = this._listeners;

    return listeners[type] !== undefined && listeners[type].includes(listener);
  }

  removeEventListener(type: string, listener: ListenerEventLambda) {
    if (this._listeners === undefined)
      return;

    const listeners = this._listeners;
    const listenerArray = listeners[type];

    if (listenerArray !== undefined) {
      const index = listenerArray.indexOf(listener);

      if (index !== -1) {
        listenerArray.splice(index, 1);
      }
    }
  }

  removeAllEventListeners() {
    if (this._listeners === undefined)
      return;

    for (const type in this._listeners) {
      this._listeners[type].length = 0;
      delete this._listeners[type];
    }
    this._listeners = undefined;
  }

  dispatchEvent(event: ListenerEvent) {
    if (this._listeners === undefined)
      return;

    const listeners = this._listeners;
    const listenerArray = listeners[event.type];

    if (listenerArray !== undefined) {
      event.target = this;

      // Make a copy, in case listeners are removed while iterating.
      const array = listenerArray.slice(0);

      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
    }
  }
}
