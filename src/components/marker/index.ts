import {CSS2DObject, CSS3DObject, CSS3DSprite} from 'three-stdlib';
import type * as THREE from 'three';
import {Component} from '@/manager/component';

const objectTypes = {
  '2d': CSS2DObject,
  '3d': CSS3DObject,
  'sprite': CSS3DSprite,
};

export interface Options {
  element: HTMLElement;
  type: keyof typeof objectTypes;
  position: THREE.Vector3;
  scale?: number | THREE.Vector3;
  zIndex?: number;
}

export class Marker extends Component {
  options: Options;

  element?: HTMLElement;

  constructor(options: Options) {
    super(options);
    this.options = options;
  }

  create() {
    const {element, position, scale, zIndex} = this.options;
    const el = document.createElement('div');
    el.appendChild(element);
    const obj = new objectTypes[this.options.type](el);
    obj.position.copy(position);
    if (scale) {
      this.setScale(scale, obj);
    }
    if (zIndex)
      obj.renderOrder = zIndex;
    this.object3D = obj;
    this.element = el;
  }

  setScale(scale: number | THREE.Vector3, object: THREE.Object3D) {
    if (typeof scale === 'number') {
      object.scale.set(scale, scale, scale);
    } else {
      object.scale.copy(scale);
    }
  }

  dispose() {
    super.dispose();
    if (this.element) {
      this.element.remove();
      this.element = undefined;
    }
  }
}
