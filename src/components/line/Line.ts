import * as THREE from 'three';
import {gsap} from 'gsap';
import {MeshLineGeometry} from './MeshLineGeometry';
import {raycast} from './raycast';
import type {MeshLineMaterialParameters} from './MeshLineMaterial';
import {MeshLineMaterial} from './MeshLineMaterial';
import {Component} from '@/manager/component';

type MaterialParameters = Omit<MeshLineMaterialParameters, 'resolution'> & {
  transparent?: boolean;
  blending?: THREE.Blending;
};

export interface Options {
  points: THREE.Vector3[];
  material: MaterialParameters;
  wcb?: (p: number) => void;
  pickable?: boolean;
  useCache?: boolean;
  animation?: {
    animationType?: 'texture' | 'dash';
    duration?: number;
    delay?: number;
    repeat?: number;
    repeatDelay?: number;
  };
}

export class Line extends Component {
  readonly name = 'Line';

  options: Options;

  material?: MeshLineMaterial;

  tween?: gsap.core.Tween;

  constructor(options: Options) {
    super(options);
    this.options = options;
  }

  create() {
    const {
      points,
      wcb,
      material: materialParams,
      pickable,
      useCache,
    } = this.options;
    const {width, height} = this.viz!.getSize()!;
    const geometry = new MeshLineGeometry();
    geometry.setPoints(points, wcb);
    let material: MeshLineMaterial | undefined;
    if (useCache) {
      material = this.viz?.cacheManager.get('lineMaterial');
      if (!material) {
        material = new MeshLineMaterial({
          ...materialParams,
          resolution: new THREE.Vector2(width, height),
        });
        this.viz?.cacheManager.set('lineMaterial', material);
      }
    } else {
      material = new MeshLineMaterial({
        ...materialParams,
        resolution: new THREE.Vector2(width, height),
      });
    }
    if (materialParams.transparent) {
      material.toneMapped = false;
      material.depthWrite = false;
      material.transparent = true;
      material.blending = materialParams.blending || THREE.NormalBlending;
    }
    this.material = material;

    const mesh = new THREE.Mesh(geometry, material);
    if (pickable) {
      mesh.raycast = raycast;
    }
    this.object3D = mesh;
  }

  animateIn(duration: number) {
    if (this.material) {
      gsap.fromTo(
        this.material,
        {visibility: 0},
        {
          visibility: 1,
          duration,
          onStart: () => {
            this.show();
          },
        },
      );
    }
  }

  animateTexture() {
    const {animation} = this.options;
    if (animation && this.material) {
      const {duration = 3, delay = 0, repeat = -1, repeatDelay = 0} = animation;
      this.tween = gsap.to(this.material.offset, {
        x: -1,
        duration,
        delay,
        repeat,
        repeatDelay,
        ease: 'none',
      });
    }
  }

  animateDash() {
    const {animation} = this.options;
    if (animation && this.material) {
      const {duration = 3, delay = 0, repeat = -1, repeatDelay = 0} = animation;
      this.tween = gsap.to(this.material, {
        dashOffset: 0,
        duration,
        delay,
        repeat,
        repeatDelay,
        ease: 'none',
      });
    }
  }

  render() {
    const {animation} = this.options;
    if (animation) {
      const {animationType = 'texture'} = animation;
      if (animationType === 'texture') {
        this.animateTexture();
      } else if (animationType === 'dash') {
        this.animateDash();
      }
    }
  }

  setSize(width: number, height: number) {
    this.material?.resolution.set(width, height);
  }

  dispose() {
    super.dispose();
    this.material = undefined;
    this.tween?.kill();
    this.tween = undefined;
  }
}
