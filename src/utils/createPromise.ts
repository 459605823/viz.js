export function createPromise() {
  let resolve: (value?: unknown) => void = () => {}
  let reject: (reason?: unknown) => void = () => {}
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return {
    promise,
    resolve,
    reject,
  }
}
