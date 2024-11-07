import {geoEquirectangular} from 'd3-geo'
import {ComponentManager, ExtrudeMap, Viz} from '@/index'

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
    viz.cameraControl?.fitToBox(map.boundingBox, false)
  }

  dispose() {
    this.viz.dispose()
  }
}
