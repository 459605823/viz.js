export function createPromise<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

export class Deferred<T> {
  promise: Promise<T>;

  resolve!: (value: T) => void;

  reject!: (reason: unknown) => void;

  constructor() {
    const {promise, resolve, reject} = createPromise<T>();
    this.promise = promise;
    this.resolve = resolve;
    this.reject = reject;
  }
}
