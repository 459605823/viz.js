import * as THREE from 'three';
import {gsap} from 'gsap';
import {MeshLineGeometry} from './MeshLineGeometry';
import {raycast} from './raycast';
import type {MeshLineMaterialParameters} from './MeshLineMaterial';
import {MeshLineMaterial} from './MeshLineMaterial';
import {Component} from '@/manager/component';

type MaterialParameters = Omit<MeshLineMaterialParameters, 'resolution' | 'dashArray' | 'dashRatio'> & {
  blending?: THREE.Blending;
  transparent?: boolean;
};

export interface Options {
  points: THREE.Vector3[];
  material: MaterialParameters;
  wcb?: (p: number) => void;
  pickable?: boolean;
  useCache?: boolean;
  visibleLength?: number;
  speed?: number;
  animation?: 'texture' | 'dash';
}

export class Line extends Component {
  readonly name = 'Line';

  options: Options;

  material?: MeshLineMaterial;

  dyingAt = 1;

  get dashLength() {
    if (this.material) {
      const voidLength = this.material.dashArray * this.material.dashRatio;
      return this.material.dashArray - voidLength;
    }
    return 0;
  }

  get diedAt() {
    return this.dyingAt + this.dashLength;
  }

  get isDied() {
    if (this.material) {
      return this.material.dashOffset < -this.diedAt;
    }
    return false;
  }

  get isDying() {
    if (this.material) {
      return this.material.dashOffset < -this.dyingAt;
    }
    return false;
  }

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
      visibleLength = 1,
      animation,
    } = this.options;
    const {width, height} = this.viz!.getSize()!;
    const geometry = new MeshLineGeometry();
    geometry.setPoints(points, wcb);
    const dashParams = animation === 'dash'
      ? {
        // Here 2 mean a cash is 2 time longer that the original length
          dashArray: 2,
          dashRatio: 1 - (visibleLength * 0.5),
        }
      : {};
    let material: MeshLineMaterial | undefined;
    if (useCache) {
      material = this.viz?.cacheManager.get('lineMaterial');
      if (!material) {
        material = new MeshLineMaterial({
          ...materialParams,
          ...dashParams,
          resolution: new THREE.Vector2(width, height),
        });
        this.viz?.cacheManager.set('lineMaterial', material);
      }
    } else {
      material = new MeshLineMaterial({
        ...materialParams,
        ...dashParams,
        resolution: new THREE.Vector2(width, height),
      });
    }
    material.transparent = materialParams.transparent ?? true;
    if (material.transparent) {
      material.depthWrite = false;
    }
    material.blending = materialParams.blending || THREE.NormalBlending;
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

  update() {
    if (!this.material)
      return;
    const {animation, speed = 0.01} = this.options;
    if (animation === 'dash') {
      this.material.dashOffset -= speed;
    } else if (animation === 'texture') {
      this.material.offset.x -= speed;
    }
  }

  setSize(width: number, height: number) {
    this.material?.resolution.set(width, height);
  }

  dispose() {
    super.dispose();
    this.material = undefined;
  }
}
