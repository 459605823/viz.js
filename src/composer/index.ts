import {
  BlendFunction,
  type BloomEffectOptions,
  CopyPass,
  type Effect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  RenderPass,
  SelectiveBloomEffect,
} from 'postprocessing';
import * as THREE from 'three';

export interface Options {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  antialias?: 'msaa' | 'fxaa';
  multisampling?: number;
  bloom?: boolean | BloomEffectOptions;
}

export class ComposerController {
  private composer: EffectComposer;

  options: Options;

  private bloomEffect?: SelectiveBloomEffect;

  constructor(options: Options) {
    this.options = options;
    const {renderer, scene, camera, bloom, antialias = 'msaa', multisampling = 4} = options;
    const {isWebGL2, maxSamples} = renderer.capabilities;
    const composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: isWebGL2 && antialias === 'msaa' ? Math.min(multisampling, maxSamples) : 0,
    });
    this.composer = composer;
    composer.addPass(new RenderPass(scene, camera));
    const effects = [] as Effect[];
    if (antialias === 'msaa') {
      this.composer.addPass(new CopyPass());
    } else if (antialias === 'fxaa') {
      effects.push(new FXAAEffect({blendFunction: BlendFunction.NORMAL}));
    }
    if (bloom) {
      effects.push(this.addBloomEffect(bloom === true ? {} : bloom));
    }
    composer.addPass(new EffectPass(camera, ...effects));
  }

  private addBloomEffect(params?: BloomEffectOptions) {
    const {scene, camera} = this.options;
    const effect = new SelectiveBloomEffect(scene, camera, {
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.2,
      mipmapBlur: true,
      intensity: 4.0,
      ...params,
    });
    effect.inverted = true;
    effect.ignoreBackground = true;
    this.bloomEffect = effect;
    return effect;
  }

  public toggleBloom(object3D: THREE.Object3D) {
    this.bloomEffect?.selection.toggle(object3D);
  }

  public render() {
    this.composer.render();
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  dispose() {
    this.composer.multisampling = 0;
    this.composer.dispose();
    this.bloomEffect = undefined;
  }
}
