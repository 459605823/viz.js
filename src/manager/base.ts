import type Viz from '@/Viz'

export default class Manager {
  viz?: Viz

  name = 'Manager'

  install(viz: Viz) {
    this.viz = viz
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  update(delta?: number) {}

  // eslint-disable-next-line unused-imports/no-unused-vars
  setSize(width: number, height: number) {}

  dispose() {
    this.viz = undefined
  }
}
