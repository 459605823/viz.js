import * as THREE from 'three'
import type { Pencil } from '..'
import {
  createPromise,
  disposeObject3D,
  getBounds,
  hasObject,
  isObjectVisible,
} from '../utils'
import Manager from './base'
import type { KeyOf } from '@/types/utils'

interface ComponentOptions {
  [key: string]: any
  key?: string
}

export class Component extends THREE.EventDispatcher {
  readonly isComponent = true

  options: ComponentOptions = {}

  object3D: THREE.Object3D = new THREE.Group()

  id: string

  private manager?: ComponentManager<any>

  pencil?: Pencil

  userData: Record<string, any> = {}

  pm = createPromise()

  /**
   * 表示组件是否在视野内，没有被其他物体遮挡
   */
  get visible() {
    return isObjectVisible(
      this.object3D,
      this.pencil!.camera,
      this.pencil!.raycaster,
      this.manager!.object3Ds,
    )
  }

  get bound() {
    return getBounds(this.object3D)
  }

  constructor(options: ComponentOptions = {}) {
    super()
    this.options = options
    this.id = options.key || THREE.MathUtils.generateUUID()
  }

  public create() {}

  public render() {}

  // eslint-disable-next-line unused-imports/no-unused-vars
  public update(delta: number) {}

  // eslint-disable-next-line unused-imports/no-unused-vars
  public setSize(width: number, height: number) {}

  public hide() {
    this.object3D.visible = false
  }

  public show() {
    this.object3D.visible = true
  }

  public add(object: Parameters<THREE.Object3D['add']>[0]) {
    this.object3D.add(object)
  }

  public remove(object: Parameters<THREE.Object3D['remove']>[0]) {
    this.object3D.remove(object)
  }

  public has(object: THREE.Object3D) {
    return hasObject(object, this.object3D)
  }

  public showBoundingBox(color = '#ff0000') {
    if (!this.pencil?.option.dev)
      return
    const helper = new THREE.Box3Helper(
      this.bound.bbox,
      new THREE.Color(color),
    )
    this.pencil?.scene?.add(helper)
  }

  public showBoundingSphere(color = '#ff0000') {
    if (!this.pencil?.option.dev)
      return
    const { center, radius } = this.bound.sphere
    const geometry = new THREE.SphereGeometry(radius, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      wireframe: true,
    })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(center)
    this.pencil?.scene?.add(sphere)
  }

  public dispose() {
    this.object3D.removeFromParent()
    disposeObject3D(this.object3D)
    this.pencil = undefined
    this.manager = undefined
  }
}

export class ComponentManager<
  T extends Record<string, new (...args: any[]) => Component>,
> extends Manager {
  readonly name = 'ComponentManager'

  private componentMap = new Map()

  private instances: any[] = []

  get componentPromise() {
    return this.instances.map(instance => instance.pm.promise)
  }

  get object3Ds() {
    return this.instances.map(instance => instance.object3D)
  }

  constructor(componentMap: T) {
    super()
    Object.entries(componentMap).forEach(([name, component]) => {
      this.componentMap.set(name, component)
    })
  }

  getInstances<Y extends KeyOf<T>>(name: Y): InstanceType<T[Y]>[]
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string
  ): InstanceType<T[Y]> | undefined
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string[]
  ): InstanceType<T[Y]>[]
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string | string[] | undefined = undefined,
  ): InstanceType<T[Y]> | InstanceType<T[Y]>[] | undefined {
    if (typeof key === 'string') {
      return this.instances.find(instance => instance.id === `${name}#${key}`)
    }
    else if (Array.isArray(key) && key.length) {
      return key
        .map(k =>
          this.instances.find(instance => instance.id === `${name}#${k}`),
        )
        .filter(Boolean) as InstanceType<T[Y]>[]
    }
    else {
      return this.instances.filter(instance => instance.id?.startsWith(name))
    }
  }

  getInstance<Y extends KeyOf<T>>(
    name: Y,
    key?: string,
  ): InstanceType<T[Y]> | undefined {
    if (key) {
      return this.instances.find(instance => instance.id === `${name}#${key}`)
    }
    else {
      return this.instances.find(instance => instance.id?.startsWith(name))
    }
  }

  async draw<Y extends KeyOf<T>>(
    name: Y,
    options: ConstructorParameters<T[Y]>[0] = {},
    parent?: THREE.Object3D | Component,
  ): Promise<InstanceType<T[Y]>> {
    const ComponentConstructor = this.componentMap.get(name)
    if (!ComponentConstructor) {
      throw new Error(`未找到名为${name}的组件`)
    }
    const pencil = this.pencil!
    const key = options.key
    let id = `${name}#${THREE.MathUtils.generateUUID()}`
    if (key) {
      id = `${name}#${key}`
    }
    const instance = new ComponentConstructor(options)
    instance.id = id
    this.instances.push(instance)
    instance.pencil = pencil
    instance.manager = this
    try {
      await instance.create()
    }
    catch (error) {
      instance.pm.reject(`创建${name}时发生错误: ${error}`)
    }
    instance.render()
    instance.pm.resolve()
    parent = parent || pencil.scene
    parent?.add(instance.object3D)
    return instance
  }

  erase(
    name: KeyOf<T> | InstanceType<T[keyof T]> | InstanceType<T[keyof T]>[],
    key?: string | string[],
  ) {
    const instances
      = typeof name === 'string'
        ? this.getInstances(
          name,
          Array.isArray(key) ? key : ([key].filter(Boolean) as string[]),
        )
        : Array.isArray(name)
          ? name
          : [name]
    if (instances?.length) {
      instances.forEach((instance) => {
        instance.dispose()
        this.instances = this.instances.filter(i => i.id !== instance.id)
      })
    }
  }

  clear() {
    this.instances.forEach(instance => this.erase(instance))
    this.instances = []
  }

  update(delta: number) {
    this.instances.forEach(instance => instance.update(delta))
  }

  setSize(width: number, height: number) {
    this.instances.forEach(instance => instance.setSize(width, height))
  }

  dispose() {
    this.clear()
    super.dispose()
  }
}
