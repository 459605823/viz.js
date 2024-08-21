import type THREE from 'three'
import type {BillboardProps} from '@pmndrs/vanilla'
import {Billboard as BillboardImpl} from '@pmndrs/vanilla'
import {Component} from '@/manager/component'

export interface Options {
  object: THREE.Object3D
  billboardConfig?: BillboardProps
}

export class Billboard extends Component {
  options: Options

  billboard?: ReturnType<typeof BillboardImpl>

  constructor(options: Options) {
    super(options)
    this.options = options
  }

  create() {
    const {object, billboardConfig = {}} = this.options
    const billboard = BillboardImpl()
    billboard.group.add(object)
    billboard.updateProps(billboardConfig)
    this.billboard = billboard
    this.object3D = billboard.group
  }

  updateProps(props: BillboardProps) {
    this.billboard?.updateProps(props)
  }

  update() {
    this.billboard?.update(this.pencil!.camera)
  }

  dispose() {
    super.dispose()
    this.billboard = undefined
  }
}
