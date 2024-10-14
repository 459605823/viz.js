import * as THREE from 'three';
import Stats from 'stats.js';
import type {CSS2DRenderer, CSS3DRenderer} from 'three-stdlib';
import createScene, {type Options as SceneOptions} from './scene';
import createRenderer, {
  type Options as RendererOptions,
  createCSSRenderer,
  setGUI as setRendererGUI,
} from './renderer';
import createCamera, {
  type Options as CameraOptions,
  setGUI as setCameraGUI,
} from './camera';
import {ComposerController, type Options as ComposerOptions} from './composer';
import {
  AssetManager,
  CacheManager,
  EventManager,
  GuiManager,
  InteractionManager,
} from './manager';
import type Manager from './manager/base';
import {shaderChunkManager, vizShaderChunks} from '@/materials';
import {getBounds} from '@/utils';
import type {KeyOf} from '@/types/utils';

export interface Options {
  container: HTMLElement;
  staticPath?: string;
  dev?: boolean;
  gui?: boolean;
  stats?: boolean;
  axis?: boolean;
  scene?: SceneOptions;
  renderer?: Omit<RendererOptions, 'width' | 'height' | 'dev'>;
  cssRenderer?: '2d' | '3d' | 'both';
  camera?: Omit<CameraOptions, 'width' | 'height' | 'domElement'>;
  composer?: Omit<ComposerOptions, 'renderer' | 'scene' | 'camera'>;
}

const defaultOptions: Partial<Options> = {
  staticPath: '/',
  dev: false,
  gui: true,
  stats: true,
  axis: true,
};

export default class Viz<
  T extends Record<string, Manager> = Record<string, Manager>,
> {
  option: Options;

  scene?: ReturnType<typeof createScene>;

  renderer?: ReturnType<typeof createRenderer>;

  cssRenderer: Array<CSS2DRenderer | CSS3DRenderer> = [];

  cameraControl?: ReturnType<typeof createCamera>;

  composerController?: ComposerController;

  private managerMap = new Map();

  private stats?: Stats;

  private resizeObserver?: ResizeObserver;

  raycaster = new THREE.Raycaster();

  private animationFrames: Array<(delta?: number) => void> = [];

  get camera() {
    return this.cameraControl?.camera as THREE.PerspectiveCamera;
  }

  get eventManager() {
    // @ts-expect-error get default manager
    return this.getManager('event') as EventManager;
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
    this.registerManager('event', new EventManager());
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
    const renderer = createRenderer({...rendererOptions, dev, width, height});
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
    // create composer
    this.composerController = new ComposerController({
      renderer,
      scene,
      camera: cameraControl.camera,
      ...composerOptions,
    });
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
      if (this.guiManager) {
        setRendererGUI(this.guiManager, renderer);
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

  render(delta: number) {
    this.managerMap.forEach(manager => manager.update(delta));
    this.cameraControl?.update(delta);
    this.stats?.update();
    this.composerController?.composer?.render();
    this.cssRenderer.forEach((renderer) => {
      renderer.render(this.scene!, this.camera!);
    });
  }

  resize(width: number, height: number) {
    this.managerMap.forEach(manager => manager.setSize(width, height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composerController?.composer.setSize(width, height);
    this.cssRenderer.forEach((renderer) => {
      renderer.setSize(width, height);
    });
  }

  start(fn?: (delta?: number) => void) {
    const clock = new THREE.Clock();
    this.renderer?.setAnimationLoop(() => {
      const delta = clock.getDelta();
      this.render(delta);
      fn?.(delta);
      this.animationFrames.forEach(frame => frame(delta));
    });
  }

  requestAnimationFrame(
    fn: (delta?: number) => void,
    config: {once?: boolean; duration?: number} = {},
  ) {
    const {once = false, duration = Infinity} = config;
    let startTime: number;
    const callback = (delta?: number) => {
      if (!startTime) {
        startTime = performance.now();
      }
      const currentTime = performance.now();
      const elapsedTime = currentTime - startTime;
      fn(delta);
      if (once || elapsedTime > duration) {
        this.animationFrames = this.animationFrames.filter(
          fn => fn !== callback,
        );
      }
    };
    this.animationFrames.push(callback);
  }

  stop() {
    this.renderer?.setAnimationLoop(null);
    this.animationFrames.length = 0;
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
  }
}
