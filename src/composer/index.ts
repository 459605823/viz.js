import type {
  BlendFunction,

  BloomEffectOptions,
  CopyPass,
  type Effect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  RenderPass,
  SelectiveBloomEffect,
} from 'postprocessing'
import * as THREE from 'three'

export interface Options {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  antialias?: 'msaa' | 'fxaa'
  multisampling?: number
  bloom?: boolean | BloomEffectOptions
}

export class ComposerController {
  composer: EffectComposer

  options: Options

  bloomEffect?: SelectiveBloomEffect

  constructor(options: Options) {
    const { renderer, scene, camera, bloom } = options
    const composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
    })
    this.options = options
    this.composer = composer
    composer.addPass(new RenderPass(scene, camera))
    const effects = [this.addAAEffect()].filter(Boolean) as Effect[]
    if (bloom) {
      effects.push(this.addBloomEffect(bloom === true ? {} : bloom))
    }
    composer.addPass(new EffectPass(camera, ...effects))
  }

  private addAAEffect() {
    const { renderer, antialias = 'msaa', multisampling = 4 } = this.options
    const { isWebGL2, maxSamples } = renderer.capabilities
    this.composer.multisampling
      = isWebGL2 && antialias === 'msaa'
        ? Math.min(multisampling, maxSamples)
        : 0
    if (antialias === 'msaa') {
      return this.composer.addPass(new CopyPass())
    }
    else if (antialias === 'fxaa') {
      return new FXAAEffect({ blendFunction: BlendFunction.ADD })
    }
  }

  private addBloomEffect(params?: BloomEffectOptions) {
    const { scene, camera } = this.options
    const effect = new SelectiveBloomEffect(scene, camera, {
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.2,
      mipmapBlur: true,
      intensity: 4.0,
      ...params,
    })
    effect.ignoreBackground = true
    this.bloomEffect = effect
    return effect
  }

  public toggleBloom(object3D: THREE.Object3D) {
    this.bloomEffect?.selection.toggle(object3D)
  }

  dispose() {
    this.composer.multisampling = 0
    this.composer.dispose()
    this.bloomEffect = undefined
  }
}
