import {Billboard, ComponentManager, Pencil, THREE} from '@/index'

const componentManager = new ComponentManager({
  Billboard,
})

export default class Map {
  pencil: Pencil

  constructor(el: HTMLElement) {
    const pencil = new Pencil(
      {
        dev: true,
        container: el,
      },
      {
        componentManager,
      },
    )
    this.pencil = pencil
  }

  async init() {
    const pencil = this.pencil
    const texture = (await pencil.assetManager.loadAsset({
      type: 'texture',
      url: '/uv_grid_opengl.jpg',
    })) as THREE.Texture
    const geometry = new THREE.PlaneGeometry(1, 2)
    const material = new THREE.MeshBasicMaterial({map: texture})
    const mesh = new THREE.Mesh(geometry, material)
    await componentManager.draw('Billboard', {
      object: mesh,
    })
    pencil.start()
  }

  dispose() {
    this.pencil.dispose()
  }
}
