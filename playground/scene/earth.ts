import {THREE, Viz, PolygonGeometry, MeshLineGeometry, MeshLineMaterial} from '@/index'
import GeoJsonGeometry from 'three-geojson-geometry'
import {booleanClockwise} from '@turf/turf'

export default class Map {
  viz: Viz

  constructor(el: HTMLElement) {
    const viz = new Viz(
      {
        dev: true,
        container: el,
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
    const materials = [sideMaterial, faceMaterial, faceMaterial]
    const polygonMeshes: THREE.Mesh[] = [];
    const lines: THREE.LineSegments[] = [];
    const alt = 10;
    const {width, height} = this.viz.getSize()
    const lineMat = new MeshLineMaterial({
      lineWidth: 10,
      color: '#f00',
      sizeAttenuation: 0,
      resolution: new THREE.Vector2(width, height),
    })
    geojson.features.forEach(({geometry}: any) => {
      const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
      polygons.forEach((coords: any) => {
        const reversedCoords = [...coords]
        const isClockwise = booleanClockwise(coords[0])
        console.log(coords, isClockwise)
        if (!isClockwise) {
          reversedCoords[0].reverse()
        }
        polygonMeshes.push(
          new THREE.Mesh(
            new PolygonGeometry(reversedCoords, alt - 1, alt, false, true, true, 10),
            materials
          ),
        );
      });
      const lineGeo = new GeoJsonGeometry(geometry, alt);
      const meshlineGeo = new MeshLineGeometry();
      meshlineGeo.setPoints(lineGeo)
      lines.push(new THREE.Mesh(meshlineGeo, lineMat));
    })
    polygonMeshes.forEach(mesh => viz.scene?.add(mesh));
    lines.forEach(line => viz.scene?.add(line));
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
