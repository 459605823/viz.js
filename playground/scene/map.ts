import {geoEquirectangular} from 'd3-geo'
import {ComponentManager, ExtrudeMap, Viz, THREE, FakeGlowMaterial} from '@/index'

const projection = geoEquirectangular()
  .center([0, 0])
  .scale(3)
  .translate([0, 0])
  .precision(0.1)

const componentManager = new ComponentManager({
  ExtrudeMap,
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
    viz.assetManager.setAsset([
      {
        type: 'json',
        url: '/geojson/world.json',
      },
    ])
    this.viz = viz
  }

  async init() {
    const viz = this.viz
    await viz.assetManager.load()
    const geojson = await viz.assetManager.getAsset('/geojson/world.json')
    const map = await componentManager.draw('ExtrudeMap', {
      projection,
      depth: 0.1,
      outline: false,
      geojson: geojson as any,
    })
    await Promise.all(componentManager.componentPromise)
    viz.start()
    await viz.cameraControl?.fitToBox(map.object3D, true, {
      cover: false,
      paddingBottom: 1,
      paddingLeft: 1,
      paddingRight: 1,
      paddingTop: 1,
    })
    map.hide()
    const mesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.8, 0.5, 128, 128),
      new FakeGlowMaterial({glowColor: '#8039ea'}),
    )
    viz.scene?.add(mesh)
    const torusMaterial = new THREE.MeshBasicMaterial({ color: '#2babab'})
    const torusMesh2 = new THREE.TorusKnotGeometry(0.8, 0.1, 128, 128)
    const Torus2 = new THREE.Mesh(torusMesh2, torusMaterial)
    viz.scene?.add(Torus2)
  }

  dispose() {
    this.viz.dispose()
  }
}
