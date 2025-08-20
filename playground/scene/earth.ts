import {THREE, Viz, ComponentManager, GeoMesh} from '@/index'

const componentManager = new ComponentManager({
  GeoMesh,
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
        componentManager
      }
    )
    viz.assetManager.setAsset([
      {
        type: 'json',
        url: '/geojson/china.json',
        name: "geojson"
      },
      {
        type: 'texture',
        url: '/uv_grid_opengl.jpg',
      },
    ])
    this.viz = viz
  }

  async init() {
    const viz = this.viz
    await viz.assetManager.load()
    const geojson = await viz.assetManager.getAsset<any>('geojson')
    const texture = await viz.assetManager.getAsset('/uv_grid_opengl.jpg')
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      // wireframe: true
    })
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    const sideMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide, color: 'green'
    })
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 'red',
      linewidth: 10,
    })
    const alt = 10;
    geojson.features.forEach(({geometry}: any) => {
      componentManager.draw('GeoMesh', {
        geojson: geometry,
        depth: 0.1,
        topHeight: alt,
        closeBottom: false,
        closeTop: true,
        includeSides: true,
        curvatureResolution: 10,
        faceMaterial,
        sideMaterial,
        bottomMaterial: faceMaterial,
        borderMaterial
      }).then((mesh) => {
        console.log(mesh)
      })
    })
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
