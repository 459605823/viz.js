import {fragment, vertex} from './shader';
import {Component, THREE} from '@/index';

export interface RippleOptions {
  radius: number;
  color?: string;
  lonlat: [number, number];
  maxRadius?: number;
  duration?: number;
  ringWidth?: number; // 环的宽度（uv 空间）
  centerSize?: number; // 圆心点半径（uv 空间）
}

const defaultOptions: Partial<RippleOptions> = {
  color: '#5372ff',
  lonlat: [0, 0],
  maxRadius: 0.2,
  duration: 2000,
  ringWidth: 0.08,
  centerSize: 0.05,
};

export class Ripple extends Component<RippleOptions> {
  name = 'Ripple';
  private material: THREE.ShaderMaterial | null = null;
  private elapsed = 0; // ms

  constructor(options: RippleOptions) {
    super({...defaultOptions, ...options});
  }

  create() {
    const {radius, color, lonlat, maxRadius, duration, ringWidth, centerSize = 0.02} = this.options;
    // 单位平面，使用透明着色器
    const geometry = new THREE.CircleGeometry(1, 32);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: {value: new THREE.Color(color)},
        uTime: {value: 0},
        uMaxRadius: {value: maxRadius},
        uDuration: {value: duration},
        uRingWidth: {value: ringWidth},
        uCenterSize: {value: centerSize},
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const position = this.lonlatToVector3(lonlat[0], lonlat[1], radius);
    const normal = position.clone().normalize();
    const from = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(from, normal);
    mesh.quaternion.copy(q);
    mesh.position.copy(position);
    mesh.renderOrder = 2000;
    this.add(mesh);
    this.material = material;
  }

  update(delta: number) {
    if (!this.material)
      return;
    this.elapsed += delta * 1000;
    const durationMs = this.options.duration ?? 2000;
    // 循环播放
    if (this.elapsed > durationMs) {
      this.elapsed -= durationMs * Math.floor(this.elapsed / durationMs);
    }
    this.material.uniforms.uTime.value = this.elapsed;
  }

  lonlatToVector3(lon: number, lat: number, radius: number) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }
}
