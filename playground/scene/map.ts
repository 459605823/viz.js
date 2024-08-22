import {geoEquirectangular} from 'd3-geo'
import {ComponentManager, ExtrudeMap, Pencil, THREE} from '@/index'

const projection = geoEquirectangular()
  .center([0, 0])
  .scale(3)
  .translate([0, 0])
  .precision(0.1)

const componentManager = new ComponentManager({
  ExtrudeMap,
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
    pencil.assetManager.setAsset([
      {
        type: 'json',
        url: '/geojson/world.json',
      },
    ])
    this.pencil = pencil
  }

  async init() {
    const pencil = this.pencil
    await pencil.assetManager.load()
    const geojson = await pencil.assetManager.getAsset('/geojson/world.json')
    const map = await componentManager.draw('ExtrudeMap', {
      projection,
      depth: 0.1,
      outline: false,
      geojson: geojson as any,
    })
    await Promise.all(componentManager.componentPromise)
    pencil.start()
    await pencil.cameraControl?.fitToBox(map.object3D, true, {
      cover: false,
      paddingBottom: 1,
      paddingLeft: 1,
      paddingRight: 1,
      paddingTop: 1,
    })
    const china = map.polygonMap.get('中国')
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 32),
      new THREE.MeshBasicMaterial({color: 0xFF0000, depthTest: false}),
    )
    mesh.position.copy(china!.center)
    pencil.scene?.add(mesh)
    console.log(map.polygonMap)
    console.log('china', china)
    pencil.cameraControl?.fitToSphere(mesh, false)
  }

  dispose() {
    this.pencil.dispose()
  }
}
