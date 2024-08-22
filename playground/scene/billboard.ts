import {Billboard, ComponentManager, Viz, THREE} from '@/index'

const componentManager = new ComponentManager({
  Billboard,
})

export default class Map {
  viz: Viz

  constructor(el: HTMLElement) {
    const viz = new Viz(
      {
        dev: true,
        container: el,
      },
      {
        componentManager,
      },
    )
    this.viz = viz
  }

  async init() {
    const viz = this.viz
    const texture = (await viz.assetManager.loadAsset({
      type: 'texture',
      url: '/uv_grid_opengl.jpg',
    })) as THREE.Texture
    const geometry = new THREE.PlaneGeometry(1, 2)
    const material = new THREE.MeshBasicMaterial({map: texture})
    const mesh = new THREE.Mesh(geometry, material)
    await componentManager.draw('Billboard', {
      object: mesh,
    })
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
