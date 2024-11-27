import * as THREE from 'three';
import {OBB} from 'three-stdlib';
import type {Viz} from '..';
import {
  Deferred,
  disposeObject3D,
  getBounds,
  hasObject,
  isObjectVisible,
} from '../utils';
import {EventDispatcher, OBBHelper} from '../helpers';
import Manager from './base';
import type {KeyOf} from '@/types/utils';

interface ComponentOptions {
  [key: string]: any;
}

export abstract class Component<T = ComponentOptions> extends EventDispatcher {
  readonly isComponent = true;

  readonly abstract name: string;

  options: T;

  object3D: THREE.Object3D = new THREE.Group();

  id = THREE.MathUtils.generateUUID();

  manager?: ComponentManager<any>;

  viz?: Viz;

  userData: Record<string, any> = {};

  deferred = new Deferred<InstanceType<typeof Component>>();

  boundingBoxHelper?: THREE.Box3Helper;

  obbHelper?: OBBHelper;

  boundingSphereHelper?: THREE.Mesh;

  /**
   * 表示组件是否在视野内，没有被其他物体遮挡
   */
  get visible() {
    return isObjectVisible(
      this.object3D,
      this.viz!.camera,
      this.viz!.raycaster,
      this.manager!.object3Ds,
    );
  }

  /**
   * 获取组件的前方向
   */
  get forward() {
    return this.object3D.getWorldDirection(new THREE.Vector3());
  }

  /**
   * 获取组件的包围盒信息
   */
  get boundingInfo() {
    return getBounds(this.object3D);
  }

  get boundingBox() {
    return this.boundingInfo.boundingBox;
  }

  get boundingSphere() {
    return this.boundingInfo.boundingSphere;
  }

  get obb() {
    const obb = new OBB();
    obb.halfSize.copy(this.boundingInfo.size).multiplyScalar(0.5);
    this.object3D.updateMatrix();
    this.object3D.updateMatrixWorld();
    obb.applyMatrix4(this.object3D.matrixWorld);
    return obb;
  }

  constructor(options: T) {
    super();
    this.options = options;
  }

  public create() {}

  public render() {}

  // eslint-disable-next-line unused-imports/no-unused-vars
  public update(delta: number) {}

  // eslint-disable-next-line unused-imports/no-unused-vars
  public setSize(width: number, height: number) {}

  public hide() {
    this.object3D.visible = false;
  }

  public show() {
    this.object3D.visible = true;
  }

  public add(object: Parameters<THREE.Object3D['add']>[0]) {
    this.object3D.add(object);
  }

  public remove(object: Parameters<THREE.Object3D['remove']>[0]) {
    this.object3D.remove(object);
  }

  public has(object: THREE.Object3D) {
    return hasObject(object, this.object3D);
  }

  public intersectObject(object: Component | THREE.Object3D, type: 'AABB' | 'OBB' = 'AABB') {
    if (object instanceof Component && object.isComponent) {
      return type === 'AABB' ? this.boundingBox.intersectsBox(object.boundingBox) : this.obb.intersectsOBB(object.obb);
    } else if (object instanceof THREE.Object3D) {
      const box3 = new THREE.Box3().setFromObject(object as THREE.Object3D);
      if (type === 'AABB') {
        return this.boundingBox.intersectsBox(box3);
      } else {
        const obb = new OBB().fromBox3(box3);
        object.updateMatrixWorld();
        obb.applyMatrix4(object.matrixWorld);
        return this.obb.intersectsOBB(obb);
      }
    }
  }

  public showBoundingBox(color = '#ff0000') {
    if (!this.viz?.option.dev)
      return;
    const helper = new THREE.Box3Helper(
      this.boundingBox,
      new THREE.Color(color),
    );
    this.viz?.scene?.add(helper);
    this.boundingBoxHelper = helper;
  }

  public hideBoundingBox() {
    if (this.boundingBoxHelper) {
      this.boundingBoxHelper.visible = false;
    }
  }

  public showBoundingSphere(color = '#ff0000') {
    if (!this.viz?.option.dev)
      return;
    const {center, radius} = this.boundingSphere;
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      wireframe: true,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(center);
    this.viz?.scene?.add(sphere);
    this.boundingSphereHelper = sphere;
  }

  public hideBoundingSphere() {
    if (this.boundingSphereHelper) {
      this.boundingSphereHelper.visible = false;
    }
  }

  public showObbHelper(color = 0xFFFF00) {
    if (!this.viz?.option.dev)
      return;
    const helper = new OBBHelper(this.obb, this.object3D, color);
    this.viz?.scene?.add(helper);
    this.obbHelper = helper;
  }

  public hideObbHelper() {
    if (this.obbHelper) {
      this.obbHelper.visible = false;
    }
  }

  public dispose() {
    this.boundingBoxHelper?.removeFromParent();
    this.boundingSphereHelper?.removeFromParent();
    this.obbHelper?.removeFromParent();
    this.obbHelper?.dispose();
    disposeObject3D(this.object3D, this.viz?.scene);
    this.object3D.removeFromParent();
    this.viz = undefined;
    this.manager = undefined;
    this.boundingBoxHelper = undefined;
    this.boundingSphereHelper = undefined;
  }
}

export class ComponentManager<
  T extends Record<string, new (...args: any[]) => Component>,
> extends Manager {
  readonly name = 'ComponentManager';

  private componentMap = new Map<string, new (...args: any[]) => Component>();

  private instances: InstanceType<T[keyof T]>[] = [];

  get componentPromise() {
    return this.instances.map(instance => instance.deferred.promise);
  }

  get object3Ds() {
    return this.instances.map(instance => instance.object3D);
  }

  constructor(componentMap: T) {
    super();
    Object.entries(componentMap).forEach(([name, component]) => {
      this.componentMap.set(name, component);
    });
  }

  getInstances<Y extends KeyOf<T>>(name: Y): InstanceType<T[Y]>[];
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string
  ): InstanceType<T[Y]> | undefined;
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string[]
  ): InstanceType<T[Y]>[];
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string | string[] | undefined = undefined,
  ): InstanceType<T[Y]> | InstanceType<T[Y]>[] | undefined {
    if (typeof key === 'string') {
      return this.instances.find(instance => instance.id === `${name}#${key}`);
    } else if (Array.isArray(key) && key.length) {
      return key
        .map(k =>
          this.instances.find(instance => instance.id === `${name}#${k}`),
        )
        .filter(Boolean) as InstanceType<T[Y]>[];
    } else {
      return this.instances.filter(instance => instance.id?.startsWith(name));
    }
  }

  getInstance<Y extends KeyOf<T>>(
    name: Y,
    key?: string,
  ): InstanceType<T[Y]> | undefined {
    if (key) {
      return this.instances.find(instance => instance.id === `${name}#${key}`);
    } else {
      return this.instances.find(instance => instance.id?.startsWith(name));
    }
  }

  async draw<Y extends KeyOf<T>>(
    name: Y | InstanceType<T[Y]>,
    options: ConstructorParameters<T[Y]>[0]
      & {
      /**
       * 组件的唯一标识
       */
        key?: string;
      } = {},
    parent?: THREE.Object3D | Component,
  ): Promise<InstanceType<T[Y]>> {
    let instance: InstanceType<T[Y]>;
    const key = options.key;
    const viz = this.viz!;
    let id: string;
    if (typeof name === 'string') {
      const ComponentConstructor = this.componentMap.get(name);
      if (!ComponentConstructor) {
        throw new Error(`未找到名为${name}的组件`);
      }
      id = key ? `${name}#${key}` : `${name}#${THREE.MathUtils.generateUUID()}`;
      instance = new ComponentConstructor({
        ...options,
      }) as InstanceType<T[Y]>;
    } else {
      instance = name;
      id = key ? `${instance.name}#${key}` : `${instance.name}#${THREE.MathUtils.generateUUID()}`;
    }
    instance.id = id;
    instance.viz = viz;
    instance.manager = this;
    this.instances.push(instance);
    try {
      await instance.create();
    } catch (error) {
      instance.deferred.reject(`创建${name}时发生错误: ${error}`);
    }
    instance.render();
    instance.deferred.resolve(instance);
    parent = parent || viz.scene;
    parent?.add(instance.object3D);
    return instance;
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
          : [name];
    if (instances?.length) {
      instances.forEach((instance) => {
        instance.dispose();
        this.instances = this.instances.filter(i => i.id !== instance.id);
      });
    }
  }

  clear() {
    this.instances.forEach(instance => instance.dispose());
    this.instances = [];
  }

  update(delta: number) {
    this.instances.forEach(instance => instance.update(delta));
  }

  setSize(width: number, height: number) {
    this.instances.forEach(instance => instance.setSize(width, height));
  }

  dispose() {
    this.clear();
    super.dispose();
  }
}
