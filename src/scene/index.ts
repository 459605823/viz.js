import * as THREE from 'three';

export interface Options {
  background?: THREE.Texture | THREE.Color;
  fog?: THREE.Fog | THREE.FogExp2;
}

export default (options?: Options) => {
  const scene = new THREE.Scene();
  if (options?.background) {
    scene.background = options.background;
  }
  if (options?.fog) {
    scene.fog = options.fog;
  }
  return scene;
};
