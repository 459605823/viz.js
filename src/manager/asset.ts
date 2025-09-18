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
  type: AssetType;
  url: string;
  name?: string;
  version?: string;
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

  public setAsset(assets: AssetInfo[] | AssetInfo) {
    if (!Array.isArray(assets)) {
      assets = [assets];
    }
    assets.forEach((asset) => {
      this.assetMap.set(asset.url, asset);
    });
  }

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
