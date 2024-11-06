import type {Camera, Renderer} from 'three';
import {InteractionManager as IM} from 'three.interactive';
import Manager from './base';

export class InteractionManager extends Manager {
  readonly name = 'InteractionManager';

  im: IM;

  constructor(renderer: Renderer, camera: Camera) {
    super();
    this.im = new IM(renderer, camera, renderer.domElement);
  }

  add(object: Parameters<IM['add']>[0]) {
    this.im.add(object);
  }

  update() {
    this.im.update();
  }

  dispose() {
    super.dispose();
    this.im.dispose();
  }
}
