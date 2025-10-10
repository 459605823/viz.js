import {Scan, ComponentManager, Viz, THREE} from '@/index'

const componentManager = new ComponentManager({
  Scan,
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
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshBasicMaterial({map: texture}),
    )
    await componentManager.draw('Scan', {
      radius: 1.05,
      width: 0.03
    }, sphere)
    sphere.position.set(0, 1, 0)
    viz.scene?.add(sphere)
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
