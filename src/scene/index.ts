import * as THREE from 'three'

export interface Options {
  background?: THREE.Texture | THREE.Color
}

export default (options?: Options) => {
  const scene = new THREE.Scene()
  if (options?.background) {
    scene.background = options.background
  }
  return scene
}
