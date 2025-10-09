import type {
  GLTF,
} from 'three-stdlib';
import {
  DRACOLoader,
  EXRLoader,
  GLTFLoader,
  RGBELoader,
} from 'three-stdlib';
import * as THREE from 'three';
import {getCache} from '../utils';
import Manager from './base';

type AssetType = 'gltf' | 'texture' | 'json' | 'video' | 'hdr' | 'exr';

interface AssetInfo {
  /**
   * 资源类型，assetManager会根据类型选择不同的加载器进行加载，可选值为：
   * @gltf GLTF 3D模型
   * @texture 纹理图片 (jpg, png)
   * @json JSON 数据
   * @video 视频纹理 (mp4)
   * @hdr HDR 环境贴图
   * @exr EXR 环境贴图
   */
  type: AssetType;
  /** 资源的 URL 地址 */
  url: string;
  /**
   * 资源的名称，作为在assetStore中的键，用于标识和获取资源
   * @default name 如果未指定，将使用 url 作为名称
   */
  name?: string;
  /**
   * 资源版本号，用于缓存控制，当设置版本号后，资源会添加到indexedDB中进行缓存
   * @example "1.0.0"
   */
  version?: string;
  /**
   * 纹理的色彩空间设置
   * @default THREE.SRGBColorSpace
   */
  colorSpace?: THREE.ColorSpace;
}

interface AssetLoaders {
  gltf: GLTFLoader;
  texture: THREE.TextureLoader;
  json: THREE.FileLoader;
  hdr: RGBELoader;
  exr: EXRLoader;
}

function joinPath(path: string, filename: string) {
  return `${path.replace(/\/$/, '')}/${filename.replace(/^\//, '')}`;
}

export class AssetManager extends Manager {
  readonly name = 'AssetManager';

  private assetStore = new Map<string, Promise<any>>();

  private assetMap = new Map<string, AssetInfo & {loaded?: boolean}>();

  private loadingManager = new THREE.LoadingManager();

  private loaders: AssetLoaders = {
    gltf: new GLTFLoader(this.loadingManager),
    texture: new THREE.TextureLoader(this.loadingManager),
    json: new THREE.FileLoader(this.loadingManager),
    hdr: new RGBELoader(this.loadingManager),
    exr: new EXRLoader(this.loadingManager),
  };

  private dracoLoader = new DRACOLoader();

  private textureStore: THREE.Texture[] = [];

  get total() {
    return Array.from(this.assetMap.values()).length;
  }

  get loaded() {
    return Array.from(this.assetMap.values()).filter(asset => asset.loaded)
      .length;
  }

  get progress() {
    return this.total === 0 ? 1 : this.loaded / this.total;
  }

  get isLoaded() {
    return this.total === 0 ? true : this.loaded === this.total;
  }

  get staticPath() {
    return this.viz?.staticPath || '';
  }

  constructor() {
    super();
    THREE.Cache.enabled = true;
    this.setDracoPath(joinPath(this.staticPath, '/draco/gltf/'));
  }

  public setDracoPath(dracoPath: string) {
    this.dracoLoader.setDecoderPath(dracoPath);
    this.dracoLoader.preload();
    this.loaders.gltf.setDRACOLoader(this.dracoLoader);
  }

  /**
   * 设置要加载的资源信息
   *
   * 此方法用于向资源管理器中注册需要加载的资源。可以传入单个资源信息或资源信息数组。
   * 资源会被存储在内部的 assetMap 中，等待后续调用 load() 方法进行实际加载。
   *
   * @param assets - 资源信息，可以是单个 AssetInfo 对象或 AssetInfo 数组
   *
   * @example
   * ```typescript
   * // 设置单个资源
   * assetManager.setAsset({
   *   type: 'gltf',
   *   url: '/models/scene.glb',
   *   name: 'mainScene'
   * });
   *
   * // 设置多个资源
   * assetManager.setAsset([
   *   {
   *     type: 'texture',
   *     url: '/textures/diffuse.jpg',
   *     name: 'diffuseTexture',
   *     colorSpace: THREE.SRGBColorSpace
   *   },
   *   {
   *     type: 'json',
   *     url: '/data/config.json',
   *     version: '1.0.0'
   *   },
   *   {
   *     type: 'hdr',
   *     url: '/env/studio.hdr',
   *     name: 'environmentMap'
   *   }
   * ]);
   *
   * // 然后调用 load() 开始加载
   * await assetManager.load();
   * ```
   */
  public setAsset(assets: AssetInfo[] | AssetInfo) {
    if (!Array.isArray(assets)) {
      assets = [assets];
    }
    assets.forEach((asset) => {
      this.assetMap.set(asset.url, asset);
    });
  }

  /**
   * 开始加载所有已注册的资源
   *
   * 此方法会并行加载所有通过 setAsset() 方法注册的资源。每个资源都会根据其类型
   * 使用相应的加载器进行加载。加载过程中会触发进度事件，可以通过监听 'progress'
   * 和 'loaded' 事件来跟踪加载状态。
   *
   * @returns Promise 返回一个 Promise，当所有资源加载完成时 resolve
   *
   * @example
   * ```typescript
   * // 设置资源
   * assetManager.setAsset([
   *   { type: 'gltf', url: '/models/scene.glb', name: 'scene' },
   *   { type: 'texture', url: '/textures/diffuse.jpg', name: 'diffuse' },
   *   { type: 'json', url: '/data/config.json', name: 'config' }
   * ]);
   *
   * // 监听加载进度
   * viz.addEventListener('progress', (event) => {
   *   console.log(`加载进度: ${(event.message * 100).toFixed(1)}%`);
   * });
   *
   * viz.addEventListener('loaded', (event) => {
   *   if (event.message) {
   *     console.log('所有资源加载完成！');
   *   }
   * });
   *
   * // 开始加载
   * try {
   *   await assetManager.load();
   *   console.log('资源加载成功');
   *
   *   // 获取加载的资源
   *   const scene = await assetManager.getAsset('scene');
   *   const texture = await assetManager.getAsset('diffuse');
   * } catch (error) {
   *   console.error('资源加载失败:', error);
   * }
   * ```
   */
  public load() {
    return Promise.all(
      Array.from(this.assetMap.keys()).map((url) => {
        const asset = this.assetMap.get(url);
        if (!asset) {
          console.error(`Asset ${url} not found`);
          return Promise.resolve();
        }
        return this.loadAsset(asset);
      }),
    );
  }

  public getAssetUrl(url: string) {
    return url.startsWith(this.staticPath)
      ? url
      : joinPath(this.staticPath, url);
  }

  /**
   * 加载单个资源
   *
   * 此方法负责加载指定的单个资源，根据资源类型选择合适的加载器进行处理。
   * 支持缓存机制，避免重复加载同一资源。如果设置了版本号，会使用 IndexedDB 进行本地缓存。
   *
   * @param asset - 要加载的资源信息
   * @returns Promise 返回加载完成的资源对象
   *
   * @example
   * ```typescript
   * // 加载 GLTF 模型
   * const gltfAsset = await assetManager.loadAsset({
   *   type: 'gltf',
   *   url: '/models/car.glb',
   *   name: 'car-model'
   * });
   *
   * // 加载带缓存版本的纹理
   * const textureAsset = await assetManager.loadAsset({
   *   type: 'texture',
   *   url: '/textures/wood.jpg',
   *   name: 'wood-texture',
   *   version: '1.2.0',
   *   colorSpace: THREE.SRGBColorSpace
   * });
   *
   * // 加载 JSON 配置文件
   * const configAsset = await assetManager.loadAsset({
   *   type: 'json',
   *   url: '/config/settings.json',
   *   version: '2.0.0'
   * });
   * ```
   */
  public async loadAsset(asset: AssetInfo) {
    const {url, version, type} = asset;
    const name = asset.name ?? url;
    if (this.assetStore.has(name)) {
      return this.assetStore.get(name);
    }
    let assetUrl = this.getAssetUrl(url);
    if (version) {
      assetUrl = await getCache(
        assetUrl,
        type === 'json' ? 'json' : 'blob',
        version,
      );
    }
    let promise: Promise<any> = Promise.resolve();
    if (type === 'video') {
      promise = this.loadVideoTexture(asset);
    } else {
      promise = new Promise((resolve, reject) => {
        this.loaders[type].load(
          assetUrl,
          (res) => {
            this.assetLoaded(url);
            if (type === 'texture' || type === 'hdr' || type === 'exr') {
              if (type === 'texture') {
                const texture = res as THREE.Texture;
                texture.colorSpace = asset.colorSpace || THREE.SRGBColorSpace;
              }
              this.textureStore.push(res as THREE.Texture);
            }
            resolve(type === 'json' ? JSON.parse(res as string) : res);
          },
          undefined,
          reject,
        );
      });
    }
    this.assetStore.set(name, promise);
    return promise;
  }

  /**
   * 加载视频纹理
   *
   * 此方法专门用于加载视频文件并创建 Three.js VideoTexture 对象。
   * 会自动设置视频的循环播放、静音和自动播放属性，确保视频能在浏览器中正常运行。
   *
   * @param asset - 视频资源信息，类型必须为 'video'
   * @returns Promise 返回创建的 THREE.VideoTexture 对象
   *
   * @example
   * ```typescript
   * // 加载视频纹理
   * const videoTexture = await assetManager.loadVideoTexture({
   *   type: 'video',
   *   url: '/videos/background.mp4',
   *   name: 'background-video'
   * });
   *
   * // 将视频纹理应用到材质
   * const material = new THREE.MeshBasicMaterial({
   *   map: videoTexture
   * });
   *
   * // 创建平面几何体显示视频
   * const geometry = new THREE.PlaneGeometry(16, 9);
   * const mesh = new THREE.Mesh(geometry, material);
   * scene.add(mesh);
   * ```
   *
   * @remarks
   * - 视频会自动设置为循环播放 (loop = true)
   * - 自动静音 (muted = true) 以符合浏览器自动播放策略
   * - 设置自动播放 (autoplay = true)
   * - 色彩空间默认为 THREE.SRGBColorSpace
   * - 当视频可以播放时会自动开始播放
   */
  public async loadVideoTexture(asset: AssetInfo) {
    const {url, name} = asset;
    const promise = new Promise<THREE.VideoTexture>((resolve, reject) => {
      const video = document.createElement('video');
      video.src = this.getAssetUrl(url);
      video.loop = true;
      video.muted = true;
      video.autoplay = true;
      video.preload = 'auto';
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      video.addEventListener('canplaythrough', () => {
        video.play();
        this.assetLoaded(url);
        this.textureStore.push(texture);
        resolve(texture);
      });
      video.onerror = reject;
    });
    this.assetStore.set(name ?? url, promise);
    return promise;
  }

  private assetLoaded(url: string) {
    const asset = this.assetMap.get(url);
    if (!asset) {
      return;
    }
    asset.loaded = true;
    this.viz?.dispatchEvent({type: 'progress', message: this.progress});
    this.viz?.dispatchEvent({type: 'loaded', message: this.isLoaded});
  }

  public async getAsset(name: `${string}.glb`): Promise<GLTF>;
  public async getAsset(name: `${string}.gltf`): Promise<GLTF>;
  public async getAsset(name: `${string}.jpg`): Promise<THREE.Texture>;
  public async getAsset(name: `${string}.png`): Promise<THREE.Texture>;
  public async getAsset(name: `${string}.mp4`): Promise<THREE.VideoTexture>;
  public async getAsset(name: `${string}.json`): Promise<JSON>;
  public async getAsset<T = unknown>(name: string): Promise<T>;
  public async getAsset(name: string) {
    return this.assetStore.get(name);
  }

  dispose() {
    this.textureStore.forEach((texture) => {
      texture.dispose();
    });
    this.textureStore = [];
    this.assetStore.clear();
    this.assetMap.clear();
    this.dracoLoader.dispose();
  }
}
