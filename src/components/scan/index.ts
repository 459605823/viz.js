import {fragment, vertex} from './shader';
import {Component, THREE} from '@/index';

export interface ScanOptions {
  radius: number;
  color?: string | THREE.Color;
  width?: number;
  dotDensity?: number;
  dotSize?: number;
  speed?: number;
  angleMode?: 'random' | 'static';
  // 扫描相位延迟（0-1），用于多实例错开
  delay?: number;
}

const defaultOptions: Partial<ScanOptions> = {
  color: '#fff',
  width: 0.007,
  dotDensity: 10,
  dotSize: 0.2,
  speed: 0.0015,
  angleMode: 'random',
  delay: 0,
};

export class Scan extends Component<ScanOptions> {
  name = 'Scan';

  material: THREE.ShaderMaterial | null = null;

  get angleDeg() {
    return THREE.MathUtils.radToDeg(this.material?.uniforms.uAngle.value || 0);
  }

  set angleDeg(value: number) {
    this.material!.uniforms.uAngle.value = THREE.MathUtils.degToRad(value);
  }

  constructor(options: ScanOptions) {
    super({...defaultOptions, ...options});
  }

  create() {
    const {radius, color, width, dotDensity, dotSize, delay = 0} = this.options;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        // 初始相位按 delay 偏移，确保在多实例下错开显示
        iTime: {value: ((delay % 1) + 1) % 1},
        pointNum: {value: new THREE.Vector2(64, 64)},
        uColor: {value: new THREE.Color(color)},
        uAngle: {value: THREE.MathUtils.degToRad(0)},
        uWidth: {value: width},
        uDotScale: {value: dotDensity},
        uDotThreshold: {value: dotSize},
      },
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.material = material;
    const mesh = new THREE.Mesh(geometry, material);
    this.add(mesh);
  }

  update() {
    if (!this.material)
      return;
    const {speed, angleMode} = this.options;
    const u = this.material.uniforms;
    const prev = u.iTime.value;
    let t = prev + speed;
    let wrapped = false;
    if (t >= 1.0) {
      t -= 1.0;
      wrapped = true;
    }
    if (t < 0.0) {
      t += 1.0;
      wrapped = true;
    }
    u.iTime.value = t;

    // 每次新一轮扫光开始时（发生 wrap），若处于随机模式，则随机一个新角度
    if (wrapped && angleMode === 'random') {
      const prevDeg = this.angleDeg;
      let newDeg = Math.random() * 360.0;
      // 尽量避免与上一轮太接近
      if (Math.abs(newDeg - prevDeg) < 5.0) {
        newDeg = (newDeg + 30.0 + Math.random() * 60.0) % 360.0;
      }
      this.angleDeg = newDeg;
    }
  }

  render() {
    const gui = this.viz?.guiManager;
    if (!gui || !this.material)
      return;

    gui.addFolder('Scan', {
      angleDeg: {
        value: this.angleDeg,
        min: 0,
        max: 360,
        step: 1,
        onChange: (v: number) => {
          this.angleDeg = v;
        },
      },
      width: {
        value: this.material.uniforms.uWidth.value,
        min: 0.005,
        max: 0.2,
        step: 0.001,
        onChange: (v: number) => {
          this.material!.uniforms.uWidth.value = v;
        },
      },
      color: {
        value: `#${this.material.uniforms.uColor.value.getHexString()}`,
        onChange: (v: string) => {
          this.material!.uniforms.uColor.value = new THREE.Color(v);
        },
      },
      speed: {
        value: this.options.speed,
        min: -0.02,
        max: 0.02,
        step: 0.0001,
        onChange: (v: number) => {
          this.options.speed = v;
        },
      },
      dotDensity: {
        value: this.material.uniforms.uDotScale.value,
        min: 1,
        max: 40,
        step: 0.1,
        onChange: (v: number) => {
          this.material!.uniforms.uDotScale.value = v;
        },
      },
      dotSize: {
        value: this.material.uniforms.uDotThreshold.value,
        min: 0.01,
        max: 0.5,
        step: 0.001,
        onChange: (v: number) => {
          this.material!.uniforms.uDotThreshold.value = v;
        },
      },
      delay: {
        value: this.options.delay ?? 0,
        min: 0,
        max: 1,
        step: 0.001,
        onChange: (v: number) => {
          this.options.delay = v;
          if (this.material) {
            this.material.uniforms.iTime.value = ((v % 1) + 1) % 1;
          }
        },
      },
    });
  }
}
