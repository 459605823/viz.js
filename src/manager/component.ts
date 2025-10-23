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

  /** 组件名称 */
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

  /**
   * update方法，每一帧渲染前调用
   * @param delta - 当前帧与上一帧的时间差，单位为秒
   * @param elapsedTime - 自应用启动以来经过的总时间，单位为秒
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public update(delta: number, elapsedTime: number) {}

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

  /**
   * 获取指定组件的实例集合
   *
   * 此方法支持多种获取方式，根据传入参数的不同返回不同类型的结果：
   * - 仅传入组件名称：返回该组件类型的所有实例数组
   * - 传入组件名称和字符串 key：返回具有该 key 的单个实例或 undefined
   * - 传入组件名称和字符串数组 key：返回具有这些 key 的实例数组
   *
   * @template Y - 组件类型，必须是注册的组件类型之一
   * @param name - 组件名称，对应注册时的组件类型名
   * @returns 根据参数不同返回单个实例、实例数组或 undefined
   *
   * @example
   * ```typescript
   * // 获取所有 Billboard 组件实例
   * const allBillboards = componentManager.getInstances('Billboard');
   * console.log(`共有 ${allBillboards.length} 个 Billboard 实例`);
   *
   * // 获取具有特定 key 的实例
   * const playerMarker = componentManager.getInstances('Billboard', 'player');
   * if (playerMarker.length > 0) {
   *   playerMarker[0].show();
   * }
   *
   * // 获取具有多个 key 的实例数组
   * const markers = componentManager.getInstances('Billboard', ['player', 'enemy', 'npc']);
   * markers.forEach(marker => marker.hide());
   * ```
   */
  getInstances<Y extends KeyOf<T>>(name: Y): InstanceType<T[Y]>[];
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string
  ): InstanceType<T[Y]>[] | undefined;
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string[]
  ): InstanceType<T[Y]>[];
  getInstances<Y extends KeyOf<T>>(
    name: Y,
    key: string | string[] | undefined = undefined,
  ): InstanceType<T[Y]> | InstanceType<T[Y]>[] | undefined {
    if (typeof key === 'string') {
      return this.instances.filter(instance => instance.id === `${name}#${key}`);
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

  /**
   * 获取指定组件的单个实例
   *
   * 此方法用于获取组件管理器中特定组件类型的单个实例。如果指定了 key，
   * 则返回具有该 key 的实例；如果没有指定 key，则返回该组件类型的第一个实例。
   *
   * @template Y - 组件类型，必须是注册的组件类型之一
   * @param name - 组件名称，对应注册时的组件类型名
   * @param key - 可选的组件实例标识符，用于获取特定的组件实例
   * @returns 找到的组件实例，如果未找到则返回 undefined
   *
   * @example
   * ```typescript
   * // 获取第一个 Billboard 组件实例
   * const billboard = componentManager.getInstance('Billboard');
   *
   * // 获取具有特定 key 的 Billboard 组件实例
   * const specificBillboard = componentManager.getInstance('Billboard', 'player-marker');
   *
   * // 检查是否存在特定实例
   * if (componentManager.getInstance('Map', 'china-map')) {
   *   console.log('中国地图组件已存在');
   * }
   * ```
   */
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

  /**
   * 创建并绘制组件实例
   *
   * 此方法用于创建新的组件实例并将其添加到场景中。支持通过组件名称创建新实例，
   * 或者直接传入已有的组件实例。创建过程包括实例化、初始化、渲染和添加到场景树。
   *
   * @template Y - 组件类型，必须是注册的组件类型之一
   * @param name - 组件名称或已有的组件实例
   * @param options - 组件构造参数，包含组件配置选项
   * @param options.key - 可选的组件唯一标识符，用于后续查找和管理
   * @param parent - 可选的父级对象，组件将被添加到此对象下，默认为场景根节点
   * @returns Promise 返回创建的组件实例
   *
   * @throws {Error} 当指定的组件名称未注册时抛出错误
   *
   * @example
   * ```typescript
   * // 创建一个简单的 Billboard 组件
   * const billboard = await componentManager.draw('Billboard', {
   *   position: [0, 0, 0],
   *   text: 'Hello World'
   * });
   *
   * // 创建带有自定义 key 的组件，便于后续查找
   * const playerMarker = await componentManager.draw('Billboard', {
   *   key: 'player-marker',
   *   position: [10, 5, 0],
   *   color: 0xff0000
   * });
   *
   * // 将组件添加到特定的父对象下
   * const childComponent = await componentManager.draw('Map', {
   *   key: 'mini-map'
   * }, parentObject);
   *
   * // 使用已有的组件实例
   * const existingComponent = new CustomComponent(options);
   * await componentManager.draw(existingComponent, { key: 'custom' });
   * ```
   */
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

  /**
   * 删除组件实例
   *
   * 此方法用于从管理器中移除并销毁组件实例。支持多种删除方式：
   * - 通过组件名称删除所有该类型的实例
   * - 通过组件名称和 key 删除特定实例
   * - 直接传入组件实例或实例数组进行删除
   *
   * 删除过程会调用组件的 dispose 方法进行资源清理，并从场景中移除。
   *
   * @param name - 组件名称、组件实例或组件实例数组
   * @param key - 可选的组件标识符，支持单个字符串或字符串数组
   *
   * @example
   * ```typescript
   * // 删除所有 Billboard 组件
   * componentManager.erase('Billboard');
   *
   * // 删除具有特定 key 的组件
   * componentManager.erase('Billboard', 'player-marker');
   *
   * // 删除多个具有指定 key 的组件
   * componentManager.erase('Billboard', ['player', 'enemy', 'npc']);
   *
   * // 直接删除组件实例
   * const billboard = componentManager.getInstance('Billboard', 'player');
   * if (billboard) {
   *   componentManager.erase(billboard);
   * }
   *
   * // 删除多个组件实例
   * const billboards = componentManager.getInstances('Billboard');
   * componentManager.erase(billboards);
   * ```
   */
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

  update(delta: number, elapsedTime: number) {
    this.instances.forEach(instance => instance.update(delta, elapsedTime));
  }

  setSize(width: number, height: number) {
    this.instances.forEach(instance => instance.setSize(width, height));
  }

  dispose() {
    this.clear();
    super.dispose();
  }
}
