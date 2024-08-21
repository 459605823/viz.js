import type Pencil from '@/pencil'

export default class Manager {
  pencil?: Pencil

  name = 'Manager'

  install(pencil: Pencil) {
    this.pencil = pencil
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  update(delta?: number) {}

  // eslint-disable-next-line unused-imports/no-unused-vars
  setSize(width: number, height: number) {}

  dispose() {
    this.pencil = undefined
  }
}
