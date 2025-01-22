import {Component} from '@/manager/component';

type Coords = number[] | Coords[];

interface GeoJson {
  type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
  coordinates: Coords;
}

export interface Options {
  geojson: GeoJson;
}

export class GeoMesh extends Component<Options> {
  readonly name = 'GeoMesh';

  create() {

  }
}
