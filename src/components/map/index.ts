import * as THREE from 'three';
import {featureCollection, union} from '@turf/turf';
import {mergeBufferGeometries} from 'three-stdlib';
import type {geoProjection} from 'd3-geo';
import type {FeatureCollection, MultiPolygon, Polygon} from 'geojson';
import {MeshLineGeometry, MeshLineMaterial} from '../index';
import PolygonComponent, {type PolygonOptions} from './polygon';
import {Component} from '@/manager/component';

export interface Options {
  projection: ReturnType<typeof geoProjection>;
  geojson: FeatureCollection<Polygon | MultiPolygon>;
  depth?: number;
  outline?: boolean;
  faceMaterial?: THREE.Material;
  sideMaterial?: THREE.Material;
  lineMaterial?: MeshLineMaterial;
  outlineMaterial?: MeshLineMaterial;
}

export class ExtrudeMap extends Component {
  readonly name = 'ExtrudeMap';

  options: Options;

  polygonMap: Map<string, PolygonComponent> = new Map();

  get topZ() {
    return this.options.depth! + this.object3D.position.z;
  }

  get polygons() {
    return Array.from(this.polygonMap.values());
  }

  constructor(options: Options) {
    super();
    this.options = {
      depth: 1,
      outline: false,
      ...options,
    };
  }

  create() {
    this.createMaterials();
    this.createPolygons();
    if (this.options.outline) {
      this.createOutline();
    }
  }

  createMaterials() {
    const {width, height} = this.viz!.getSize();
    const {lineMaterial, faceMaterial, sideMaterial, outlineMaterial}
      = this.options;
    if (!this.viz?.cacheManager.has('ExtrudeMap')) {
      const lineMat
        = lineMaterial
        ?? new MeshLineMaterial({
          lineWidth: 4,
          sizeAttenuation: 0,
          resolution: new THREE.Vector2(width, height),
          color: new THREE.Color('#69a8c7'),
        });
      lineMat.transparent = true;
      lineMat.depthTest = false;
      const outlineMat
        = outlineMaterial
        ?? new MeshLineMaterial({
          lineWidth: 4,
          sizeAttenuation: 0,
          resolution: new THREE.Vector2(width, height),
          color: new THREE.Color('#ff0000'),
        });
      outlineMat.transparent = true;
      outlineMat.depthTest = false;
      const faceMat
        = faceMaterial
        ?? new THREE.MeshBasicMaterial({
          color: '#01233c',
        });
      const sideMat
        = sideMaterial
        ?? new THREE.MeshBasicMaterial({
          color: '#004078',
        });
      this.viz?.cacheManager.set('ExtrudeMap', {
        lineMat,
        outlineMat,
        faceMat,
        sideMat,
      });
    }
  }

  createPolygons() {
    const {geojson, depth} = this.options;
    const {lineMat, faceMat, sideMat}
      = this.viz!.cacheManager.get('ExtrudeMap');
    geojson.features.forEach((feature) => {
      if (!feature.geometry || !feature.properties?.name)
        return;
      const {type, coordinates} = feature.geometry;
      const {centroid, center, name} = feature.properties;
      const props: PolygonOptions = {
        depth: depth!,
        coordinates: [],
        lineMaterial: lineMat,
        faceMaterial: faceMat,
        sideMaterial: sideMat,
        properties: feature.properties,
        name,
        center: this.projectPoint(centroid || center),
      };
      if (type === 'Polygon') {
        props.coordinates.push(this.projectPoints(coordinates[0]));
      } else if (type === 'MultiPolygon') {
        coordinates.forEach((polygon) => {
          props.coordinates.push(this.projectPoints(polygon[0]));
        });
      }
      const polygon = new PolygonComponent(props, this.viz?.scene);
      this.object3D.add(polygon);
      this.polygonMap.set(feature.properties.name, polygon);
    });
  }

  createOutline() {
    const {geojson, projection, depth} = this.options;
    const {outlineMat} = this.viz!.cacheManager.get('ExtrudeMap');
    // @ts-expect-error union type
    const outlineGeojson = geojson.features.slice(1).reduce((acc, cur) => {
      return union(featureCollection([acc, cur]));
    }, geojson.features[0]);
    const {coordinates, type} = outlineGeojson.geometry;
    const geos: THREE.BufferGeometry[] = [];
    const arr = type === 'MultiPolygon' ? coordinates.flat(1) : coordinates;
    arr.forEach((coord) => {
      const vertices: THREE.Vector3[] = [];
      coord.forEach((position) => {
        const [x, y] = projection(position as [number, number]) as [
          number,
          number,
        ];
        vertices.push(new THREE.Vector3(x, -y, depth));
      });
      const line = new MeshLineGeometry();
      line.setPoints(vertices);
      geos.push(line);
    });
    const line = new THREE.Mesh(mergeBufferGeometries(geos)!, outlineMat);
    line.renderOrder = 1;
    this.object3D.add(line);
  }

  projectPoint(point: [number, number]) {
    if (!point || point.length !== 2)
      return new THREE.Vector2(0, 0);
    const {projection} = this.options;
    const [x, y] = projection(point) as [number, number];
    return new THREE.Vector2(x, -y);
  }

  projectPoints(points: number[][]) {
    return points.map((point) => {
      return this.projectPoint(point as [number, number]);
    });
  }

  dispose() {
    Array.from(this.polygonMap.values()).forEach((polygon) => {
      polygon.dispose();
    });
    this.polygonMap.clear();
  }
}
