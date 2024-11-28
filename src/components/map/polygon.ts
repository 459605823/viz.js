import * as THREE from 'three';
import {mergeBufferGeometries} from 'three-stdlib';
import type {MeshLineMaterial} from '../index';
import {MeshLineGeometry} from '../index';
import {disposeObject3D} from '@/utils/object3D';

export interface PolygonOptions {
  depth: number;
  coordinates: THREE.Vector2[][];
  faceMaterial: THREE.Material;
  sideMaterial: THREE.Material;
  lineMaterial: MeshLineMaterial;
  bbox?: [number, number, number, number];
  [key: string]: any;
}

const bbMap = new Map();

function uvGenerator(bbox?: [number, number, number, number]) {
  return {
    generateTopUV(
      geometry: any,
      vertices: number[],
      indexA: number,
      indexB: number,
      indexC: number,
    ) {
      const ax = vertices[indexA * 3];
      const ay = vertices[indexA * 3 + 1];
      const bx = vertices[indexB * 3];
      const by = vertices[indexB * 3 + 1];
      const cx = vertices[indexC * 3];
      const cy = vertices[indexC * 3 + 1];
      let bb;
      if (bbox) {
        bb = {minX: bbox[0], maxX: bbox[2], minY: bbox[1], maxY: bbox[3]};
      } else if (bbMap.has(geometry)) {
        bb = bbMap.get(geometry);
      } else {
        const points = geometry.parameters.shapes.getPoints() as THREE.Vector2[];
        bb = {
          minX: Math.min(
            ...points.map(({x}) => {
              return x;
            }),
          ),
          maxX: Math.max(
            ...points.map(({x}) => {
              return x;
            }),
          ),
          minY: Math.min(
            ...points.map(({y}) => {
              return y;
            }),
          ),
          maxY: Math.max(
            ...points.map(({y}) => {
              return y;
            }),
          ),
        };
        bbMap.set(geometry, bb);
      }

      const bbx = bb.maxX - bb.minX;
      const bby = bb.maxY - bb.minY;

      return [
        new THREE.Vector2((ax - bb.minX) / bbx, (ay - bb.minY) / bby),
        new THREE.Vector2((bx - bb.minX) / bbx, (by - bb.minY) / bby),
        new THREE.Vector2((cx - bb.minX) / bbx, (cy - bb.minY) / bby),
      ];
    },
    generateSideWallUV(
      _: any,
      vertices: number[],
      indexA: number,
      indexB: number,
      indexC: number,
      indexD: number,
    ) {
      const ax = vertices[indexA * 3];
      const ay = vertices[indexA * 3 + 1];
      const az = vertices[indexA * 3 + 2];
      const bx = vertices[indexB * 3];
      const by = vertices[indexB * 3 + 1];
      const bz = vertices[indexB * 3 + 2];
      const cx = vertices[indexC * 3];
      const cy = vertices[indexC * 3 + 1];
      const cz = vertices[indexC * 3 + 2];
      const dx = vertices[indexD * 3];
      const dy = vertices[indexD * 3 + 1];
      const dz = vertices[indexD * 3 + 2];
      if (Math.abs(ay - by) < Math.abs(ax - bx)) {
        return [
          new THREE.Vector2(ax, 1 - az),
          new THREE.Vector2(bx, 1 - bz),
          new THREE.Vector2(cx, 1 - cz),
          new THREE.Vector2(dx, 1 - dz),
        ];
      }
      return [
        new THREE.Vector2(ay, 1 - az),
        new THREE.Vector2(by, 1 - bz),
        new THREE.Vector2(cy, 1 - cz),
        new THREE.Vector2(dy, 1 - dz),
      ];
    },
  };
}

export default class Polygon extends THREE.Object3D {
  private _mesh: THREE.Group | undefined;

  private _line: THREE.Group | undefined;

  get mesh() {
    return this._mesh;
  }

  get line() {
    return this._line;
  }

  get faceMaterial() {
    return this.userData.faceMaterial as THREE.Material;
  }

  get sideMaterial() {
    return this.userData.sideMaterial as THREE.Material;
  }

  get lineMaterial() {
    return this.userData.lineMaterial as MeshLineMaterial;
  }

  get props() {
    return this.userData.properties as Record<string, any>;
  }

  get depth() {
    return this.userData.depth as number;
  }

  get center() {
    const {center, depth} = this.userData;
    return new THREE.Vector3(center.x, center.y, depth);
  }

  constructor(options: PolygonOptions, public scene?: THREE.Scene) {
    super();
    const coordinates = options.coordinates;
    this.userData = {
      type: 'Polygon',
      ...options,
    };
    delete this.userData.coordinates;
    this.name = options.name;
    this.create(coordinates, options.depth);
  }

  create(polygons: THREE.Vector2[][], depth: number) {
    if (!polygons.length)
      return;
    const lineGroup = new THREE.Group();
    const meshGroup = new THREE.Group();
    const lineGeos: THREE.BufferGeometry[] = [];
    polygons.forEach((polygon) => {
      lineGeos.push(this.createLine(polygon, depth));
      meshGroup.add(this.createMesh(polygon, depth));
    });
    const lineGeo = mergeBufferGeometries(lineGeos);
    if (lineGeo) {
      lineGroup.add(new THREE.Mesh(lineGeo, this.userData.lineMaterial));
    }
    this._line = lineGroup;
    this._mesh = meshGroup;
    this.add(lineGroup);
    this.add(meshGroup);
  }

  createLine(pts: THREE.Vector2[], depth: number) {
    const vertices = pts.map(pt => new THREE.Vector3(pt.x, pt.y, depth));
    const line = new MeshLineGeometry();
    line.setPoints(vertices);
    return line;
  }

  createMesh(pts: THREE.Vector2[], depth: number) {
    const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
      depth,
      bevelEnabled: false,
      UVGenerator: uvGenerator(this.userData.bbox),
    });
    return new THREE.Mesh(geometry, [
      this.userData.faceMaterial,
      this.userData.sideMaterial,
    ]);
  }

  dispose() {
    disposeObject3D(this, this.scene);
    this.userData = {};
    this.scene = undefined;
    this._mesh = undefined;
    this._line = undefined;
  }
}
