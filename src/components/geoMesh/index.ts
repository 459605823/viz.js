import * as THREE from 'three';
import PolygonGeometry from 'three-conic-polygon-geometry';
import GeoJsonGeometry from 'three-geojson-geometry';
import {booleanClockwise} from '@turf/turf';
import {Component} from '@/manager/component';

interface GeoJson {
  type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
  coordinates: any;
}

export interface Options {
  geojson: GeoJson;
  bottomHeight: number;
  depth: number;
  closeBottom?: boolean;
  closeTop?: boolean;
  includeSides?: boolean;
  curvatureResolution?: number;
  faceMaterial: THREE.Material;
  sideMaterial: THREE.Material;
  bottomMaterial: THREE.Material;
  borderMaterial?: THREE.Material;
}

export class GeoMesh extends Component<Options> {
  readonly name = 'GeoMesh';

  constructor(options: Options) {
    super({
      closeBottom: false,
      includeSides: true,
      closeTop: true,
      curvatureResolution: 5,
      ...options,
    });
  }

  create() {
    const {geojson, sideMaterial, faceMaterial, bottomMaterial, borderMaterial, depth, bottomHeight, closeBottom, closeTop, includeSides, curvatureResolution} = this.options;
    const polygons = geojson.type === 'Polygon' ? [geojson.coordinates] : geojson.coordinates;
    const materials = [sideMaterial, bottomMaterial, faceMaterial];
    const topHeight = bottomHeight + depth;
    polygons.forEach((coords: any) => {
      const c = [...coords];
      const isClockwise = booleanClockwise(c[0]);
      if (!isClockwise) {
        c[0].reverse();
      }
      this.add(
        new THREE.Mesh(new PolygonGeometry(c, bottomHeight, topHeight, closeBottom, closeTop, includeSides, curvatureResolution), materials),
      );
      if (borderMaterial) {
        this.add(
          new THREE.LineSegments(new GeoJsonGeometry(geojson, topHeight, curvatureResolution), borderMaterial),
        );
      }
    });
  }
}
