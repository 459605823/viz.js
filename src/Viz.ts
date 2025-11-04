import * as THREE from 'three';
import Stats from 'stats.js';
import type {CSS2DRenderer, CSS3DRenderer} from 'three-stdlib';
import type {GridProps, GridType} from '@pmndrs/vanilla';
import {Grid} from '@pmndrs/vanilla';
import createScene, {type Options as SceneOptions} from './scene';
import createRenderer, {
  type Options as RendererOptions,
  createCSSRenderer,
} from './renderer';
import createCamera, {
  type Options as CameraOptions,
  setGUI as setCameraGUI,
} from './camera';
import {ComposerController, type Options as ComposerOptions} from './composer';
import {
  AssetManager,
  CacheManager,
  GuiManager,
  InteractionManager,
} from './manager';
import type Manager from './manager/base';
import {EventDispatcher} from '@/helpers';
import {shaderChunkManager} from '@/materials';
import {vizShaderChunks} from '@/materials/shader';
import {getBounds} from '@/utils';
import type {KeyOf} from '@/types/utils';

export interface Options {
  container: HTMLElement;
  /**
   * 静态资源前缀路径，会在assetManager获取资源url时统一加上这个路径
   * @default ''
   */
  staticPath?: string;
  /** 是否为dev模式 @default false */
  dev?: boolean;
  /** 是否创建guiManager，只有当dev为true时才有效 @default true */
  gui?: boolean;
  /** 是否创建性能监视器，只有当dev为true时才有效 @default true */
  stats?: boolean;
  /** 是否创建坐标轴，只有当dev为true时才有效 @default true */
  axis?: boolean;
  /** 是否创建底部网格，只有当dev为true时才有效 @default true */
  grid?: boolean | GridProps;
  scene?: SceneOptions;
  renderer?: Omit<RendererOptions, 'width' | 'height' | 'dev'>;
  cssRenderer?: '2d' | '3d' | 'both';
  camera?: Omit<CameraOptions, 'width' | 'height' | 'domElement'>;
  composer?: Omit<ComposerOptions, 'renderer' | 'scene' | 'camera'>;
}

const defaultOptions: Partial<Options> = {
  staticPath: '',
  dev: false,
  gui: true,
  stats: true,
  axis: true,
  grid: true,
};

export default class Viz<
  T extends Record<string, Manager> = Record<string, Manager>,
> extends EventDispatcher {
  option: Options;

  playing = false;

  scene?: ReturnType<typeof createScene>;

  renderer?: ReturnType<typeof createRenderer>;

  cssRenderer: Array<CSS2DRenderer | CSS3DRenderer> = [];

  cameraControl?: ReturnType<typeof createCamera>;

  composerController?: ComposerController;

  public raycaster = new THREE.Raycaster();

  private managerMap = new Map();

  private stats?: Stats;

  private resizeObserver?: ResizeObserver;

  private animationFrames: Array<{fn: (delta: number, elapsedTime: number) => void; order: number}> = [];

  private grid?: GridType;

  private clock = new THREE.Clock(false); // 在实例级别创建 clock，autoStart 为 false

  get staticPath() {
    return this.option.staticPath || '';
  }

  get camera() {
    return this.cameraControl?.camera as THREE.PerspectiveCamera;
  }

  get interactionManager() {
    // @ts-expect-error get default manager
    return (this.getManager('interaction') as InteractionManager).im;
  }

  get guiManager() {
    // @ts-expect-error get default manager
    return this.getManager('gui') as GuiManager | undefined;
  }

  get assetManager() {
    // @ts-expect-error get default manager
    return this.getManager('asset') as AssetManager;
  }

  get cacheManager() {
    // @ts-expect-error get default manager
    return this.getManager('cache') as CacheManager;
  }

  get sceneBoundingInfo() {
    return getBounds(this.scene!);
  }

  constructor(options: Options, managers?: T) {
    super();
    this.option = {
      ...defaultOptions,
      ...options,
    };
    if (managers) {
      Object.entries(managers).forEach(([name, manager]) => {
        this.registerManager(name, manager);
      });
    }
    shaderChunkManager.install(vizShaderChunks);
    this.registerManager('cache', new CacheManager());
    this.registerManager('asset', new AssetManager());
    if (this.option.dev && this.option.gui) {
      this.registerManager('gui', new GuiManager());
    }
    this.init();
    this.registerManager(
      'interaction',
      new InteractionManager(this.renderer!, this.camera!),
    );
  }

  private init() {
    const {
      dev,
      stats,
      axis,
      grid,
      container,
      cssRenderer,
      scene: sceneOptions,
      renderer: rendererOptions,
      camera: cameraOptions,
      composer: composerOptions,
    } = this.option;

    // create scene
    const scene = createScene(sceneOptions);
    this.scene = scene;
    // create renderer
    const {width, height} = this.getSize();
    const renderer = createRenderer({...rendererOptions, dev, width, height, postProcess: !!composerOptions});
    container.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.cssRenderer = createCSSRenderer(width, height, cssRenderer);
    this.cssRenderer.forEach((renderer) => {
      container.appendChild(renderer.domElement);
    });
    // create camera
    const cameraControl = createCamera({
      width,
      height,
      domElement: container,
      ...cameraOptions,
    });
    this.cameraControl = cameraControl;
    if (composerOptions) {
      // create composer
      this.composerController = new ComposerController({
        renderer,
        scene,
        camera: cameraControl.camera,
        ...composerOptions,
      });
    }
    // handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        this.resize(width, height);
      }
    });
    resizeObserver.observe(container);
    this.resizeObserver = resizeObserver;
    this.resize(width, height);
    // dev tools
    if (dev) {
      if (axis) {
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
      }
      if (stats) {
        const stats = new Stats();
        stats.showPanel(0);
        document.body.appendChild(stats.dom);
        this.stats = stats;
      }
      if (grid) {
        const gridIns = Grid({
          args: [10.5, 10.5],
          cellSize: 0.6,
          cellThickness: 1,
          cellColor: new THREE.Color('#6f6f6f'),
          sectionSize: 3.3,
          sectionThickness: 1.2,
          sectionColor: new THREE.Color('#9d4b4b'),
          fadeDistance: 25,
          fadeStrength: 1,
          followCamera: false,
          infiniteGrid: true,
          ...(typeof grid === 'boolean' ? {} : grid),
        });
        gridIns.mesh.position.y = 0.005;
        scene.add(gridIns.mesh);
      }
      if (this.guiManager) {
        setCameraGUI(this.guiManager, cameraControl);
      }

      // @ts-expect-error getCPCT
      window.getCPCT = () => {
        const position = this.getCameraPosition();
        const target = this.getCameraTarget();
        console.log('position:', position);
        console.log('target:', target);
      };
    }
  }

  public registerManager(name: string, manager: any) {
    manager.install(this);
    this.managerMap.set(name, manager);
  }

  public unregisterManager(name: string) {
    const manager = this.managerMap.get(name);
    if (manager) {
      manager.dispose();
      this.managerMap.delete(name);
    }
  }

  public getManager<Y extends KeyOf<T>>(name: Y): T[Y] {
    return this.managerMap.get(name);
  }

  setRaycasterThresholds(type: 'Line' | 'Points', value: number) {
    this.raycaster.params[type].threshold = value;
  }

  pick(objects: THREE.Object3D[], recursive?: boolean) {
    this.raycaster.setFromCamera(this.interactionManager.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, recursive);
  }

  getSize() {
    const {width, height} = this.option.container.getBoundingClientRect();
    return {width, height};
  }

  getCameraPosition() {
    const position = new THREE.Vector3();
    this.cameraControl?.getPosition(position);
    return position;
  }

  getCameraTarget() {
    const target = new THREE.Vector3();
    this.cameraControl?.getTarget(target);
    return target;
  }

  render(delta: number, elapsedTime: number) {
    this.managerMap.forEach(manager => manager.update(delta, elapsedTime));
    this.cameraControl?.update(delta);
    this.stats?.update();
    this.grid?.update(this.camera);
    if (this.composerController) {
      this.composerController.render();
    } else {
      this.renderer?.render(this.scene!, this.camera!);
    }
    this.cssRenderer.forEach((renderer) => {
      renderer.render(this.scene!, this.camera!);
    });
  }

  resize(width: number, height: number) {
    this.managerMap.forEach(manager => manager.setSize(width, height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.composerController) {
      this.composerController.setSize(width, height);
    } else {
      this.renderer?.setSize(width, height);
    }
    this.cssRenderer.forEach((renderer) => {
      renderer.setSize(width, height);
    });
  }

  /**
   * 启动渲染循环
   *
   * 开始 Three.js 的渲染循环。支持自定义帧率和每帧回调函数。
   * 可以多次调用 stop() 和 start() 来暂停和恢复渲染，时间会保持连续。
   *
   * @param params - 启动参数配置
   * @param params.fn - 可选的每帧回调函数，会在每帧渲染后执行
   * @param params.frameRate - 可选的目标帧率限制，例如设置为 30 表示最高 30fps
   *
   * @example
   * ```typescript
   * // 基本启动
   * viz.start();
   *
   * // 带每帧回调
   * viz.start({
   *   fn: (delta, elapsedTime) => {
   *     console.log(`帧时间: ${delta}s, 总时间: ${elapsedTime}s`);
   *   }
   * });
   *
   * // 限制帧率为 30fps
   * viz.start({ frameRate: 30 });
   *
   * // 暂停和恢复
   * viz.start();
   * setTimeout(() => viz.stop(), 2000);  // 2秒后暂停
   * setTimeout(() => viz.start(), 5000); // 5秒后恢复，时间会继续累积
   * ```
   */
  start(params: {fn?: (delta?: number, elapsedTime?: number) => void; frameRate?: number} = {}) {
    this.playing = true;
    const {fn, frameRate} = params;
    this.clock.start();
    const interval = frameRate ? 1 / frameRate : 0;
    let lastTime = 0;
    this.renderer?.setAnimationLoop(() => {
      const delta = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();
      lastTime += delta;
      if (lastTime >= interval) {
        this.render(delta, elapsedTime);
        fn?.(delta, elapsedTime);
        this.animationFrames.forEach(frame => frame.fn(delta, elapsedTime));
        lastTime = 0;
      }
    });
  }

  /**
   * 注册一个动画帧回调函数，该函数会在每次渲染循环中被调用
   *
   * 此方法允许你向渲染循环中添加自定义的动画逻辑，回调函数会接收到
   * 时间增量和总运行时间参数，用于实现基于时间的动画效果
   *
   * @param fn - 动画回调函数
   * @param fn.delta - 距离上一帧的时间增量（秒）
   * @param fn.elapsedTime - 从动画开始到现在的总时间（秒）
   * @param config - 配置选项
   * @param config.once - 是否只执行一次，默认为 false
   * @param config.duration - 执行持续时间（毫秒），超过此时间后自动移除回调，默认为无限
   * @param config.order - 执行顺序，数值越小越先执行，默认为 0
   *
   * @example
   * ```typescript
   * // 持续旋转一个物体
   * viz.requestAnimationFrame((delta, elapsedTime) => {
   *   mesh.rotation.y += delta;
   * });
   *
   * // 执行一次性动画
   * viz.requestAnimationFrame((delta) => {
   *   console.log('执行一次');
   * }, { once: true });
   *
   * // 执行 5 秒后自动停止
   * viz.requestAnimationFrame((delta) => {
   *   mesh.position.x = Math.sin(elapsedTime);
   * }, { duration: 5000 });
   *
   * // 按顺序执行（order越小越先执行）
   * viz.requestAnimationFrame(() => {
   *   console.log('第二个执行');
   * }, { order: 10 });
   *
   * viz.requestAnimationFrame(() => {
   *   console.log('第一个执行');
   * }, { order: 5 });
   * ```
   */
  requestAnimationFrame(
    fn: (delta: number, elapsedTime: number) => void,
    config: {once?: boolean; duration?: number; order?: number} = {},
  ) {
    const {once = false, duration = Infinity, order = 0} = config;
    let startTime: number | undefined;
    let accumulatedTime = 0; // 累积的运行时间（不包括暂停时间）

    const callback = (delta: number, elapsedTime: number) => {
      if (!startTime) {
        startTime = performance.now();
      }

      // 累加实际运行时间
      accumulatedTime += delta * 1000; // delta 是秒，转换为毫秒

      fn(delta, elapsedTime);

      if (once || accumulatedTime > duration) {
        this.animationFrames = this.animationFrames.filter(
          item => item.fn !== callback,
        );
      }
    };

    // 插入到正确的位置以保持排序
    const frameItem = {fn: callback, order};
    const insertIndex = this.animationFrames.findIndex(item => item.order > order);
    if (insertIndex === -1) {
      this.animationFrames.push(frameItem);
    } else {
      this.animationFrames.splice(insertIndex, 0, frameItem);
    }
  }

  captureScreenshot(type = 'image/png') {
    const canvas = this.renderer?.domElement;
    if (!canvas)
      return;
    this.render(0, 0);
    const dataURL = canvas.toDataURL(type);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `screenshot.${type.split('/')[1]}`;
    link.click();
    link.remove();
  }

  /**
   * 暂停渲染循环
   *
   * 停止 Three.js 的渲染循环，暂停所有动画和渲染。适用于需要临时停止渲染的场景，
   * 例如切换到全屏显示其他内容时。可以通过再次调用 start() 来恢复渲染，
   * 时间会保持连续，不会重置。
   *
   * @example
   * ```typescript
   * // 基本暂停
   * viz.stop();
   *
   * // 暂停后恢复
   * viz.stop();
   * // ... 显示其他内容，例如全屏视频或UI
   * viz.start(); // 恢复渲染，时间继续累积
   *
   * // 实际使用场景：切换全屏模式
   * function enterFullscreenMode() {
   *   viz.stop(); // 暂停3D渲染
   *   showFullscreenUI(); // 显示全屏UI
   * }
   *
   * function exitFullscreenMode() {
   *   hideFullscreenUI();
   *   viz.start(); // 恢复3D渲染
   * }
   * ```
   *
   * @remarks
   * - 调用 stop() 后，playing 状态会设置为 false
   * - 内部的 THREE.Clock 会停止计时，不会累积暂停期间的时间
   * - 通过 requestAnimationFrame() 注册的回调不会被移除，恢复后会继续执行
   * - requestAnimationFrame() 的 duration 配置只计算实际运行时间，不包括暂停时间
   */
  stop() {
    this.playing = false;
    this.renderer?.setAnimationLoop(null);
    this.clock.stop(); // 停止 clock
  }

  dispose() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    Array.from(this.managerMap.keys()).forEach(name =>
      this.unregisterManager(name),
    );
    this.cameraControl?.dispose();
    this.cameraControl = undefined;
    this.managerMap.clear();
    this.composerController?.dispose();
    this.composerController = undefined;
    this.renderer?.dispose();
    this.renderer = undefined;
    this.scene = undefined;
    this.stats?.dom.remove();
    this.stats = undefined;
    this.grid = undefined;
  }
}
