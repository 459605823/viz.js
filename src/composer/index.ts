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
  ToneMappingEffect,
  type ToneMappingMode,
} from 'postprocessing';
import * as THREE from 'three';

export interface Options {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  antialias?: 'msaa' | 'fxaa';
  multisampling?: number;
  bloom?: boolean | BloomEffectOptions;
  toneMapping?: ConstructorParameters<typeof ToneMappingEffect>[0] & {
    mode: ToneMappingMode;
  };
}

export class ComposerController {
  composer: EffectComposer;

  options: Options;

  bloomEffect?: SelectiveBloomEffect;

  passCount = 0;

  constructor(options: Options) {
    this.options = options;
    const {renderer, scene, camera, bloom, antialias = 'msaa', multisampling = 4, toneMapping} = options;
    const {isWebGL2, maxSamples} = renderer.capabilities;
    const composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: isWebGL2 && antialias === 'msaa' ? Math.min(multisampling, maxSamples) : 0,
    });
    this.composer = composer;
    composer.addPass(new RenderPass(scene, camera));
    this.passCount++;
    const effects = [] as Effect[];
    if (antialias === 'msaa') {
      this.composer.addPass(new CopyPass());
      this.passCount++;
    } else if (antialias === 'fxaa') {
      effects.push(new FXAAEffect({blendFunction: BlendFunction.NORMAL}));
    }
    if (bloom) {
      effects.push(this.addBloomEffect(bloom === true ? {} : bloom));
    }
    if (toneMapping) {
      effects.push(new ToneMappingEffect({
        ...toneMapping,
      }));
    }
    if (effects.length) {
      const effectPass = new EffectPass(camera, ...effects);
      composer.addPass(effectPass);
      this.passCount++;
    }
  }

  private addBloomEffect(params?: BloomEffectOptions) {
    const {scene, camera} = this.options;
    const effect = new SelectiveBloomEffect(scene, camera, params);
    effect.inverted = true;
    effect.ignoreBackground = true;
    this.bloomEffect = effect;
    return effect;
  }

  public addPass(effect: Effect | Effect[] | EffectPass, index?: number) {
    // if toneMapping is enabled, always add before the last pass
    // because toneMapping should at the end of the pipeline.
    index = this.options.toneMapping ? this.passCount - 1 : index;
    if (effect instanceof EffectPass) {
      this.composer.addPass(effect, index);
      this.passCount++;
      return effect;
    }
    if (!Array.isArray(effect)) {
      effect = [effect];
    }
    const effectPass = new EffectPass(this.options.camera, ...effect);
    this.composer.addPass(effectPass, index);
    this.passCount++;
    return effectPass;
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
