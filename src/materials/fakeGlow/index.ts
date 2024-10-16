import * as THREE from 'three';
import {fragment, vertex} from './shader';

interface FakeGlowMaterialParameters {
  /**
   * 衰减
   * @type {Uniform<number>}
   * @default 0.1
   */
  fallOff?: number;
  /**
   * The strength of the glowInternalRadius.
   * @type {Uniform<number>}
   * @default 6.0
   */
  glowInternalRadius?: number;
  /**
   * 光晕颜色
   * @type {Uniform<Color>}
   * @default new Color(#00d5ff)
   */
  glowColor?: THREE.Color | string;
  /**
   * 光晕锐度
   * @type {Uniform<number>}
   * @default 0.5
   */
  glowSharpness?: number;
  /**
   * 透明度
   * @type {Uniform<number>}
   * @default 1.0
   */
  opacity?: number;
}

const defaultParameters: FakeGlowMaterialParameters = {
  fallOff: 0.1,
  glowInternalRadius: 6.0,
  glowColor: '#00d5ff',
  glowSharpness: 0.5,
  opacity: 1.0,
};

export class FakeGlowMaterial extends THREE.ShaderMaterial {
  constructor(parameters?: FakeGlowMaterialParameters) {
    parameters = Object.assign({}, defaultParameters, parameters);
    super({
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.uniforms = {
      fallOff: new THREE.Uniform(parameters.fallOff),
      glowInternalRadius: new THREE.Uniform(parameters.glowInternalRadius),
      glowColor: new THREE.Uniform(new THREE.Color(parameters.glowColor)),
      glowSharpness: new THREE.Uniform(parameters.glowSharpness),
      opacity: new THREE.Uniform(parameters.opacity),
    };
    this.setValues(parameters);
    this.depthTest = false;
    this.transparent = true;
    this.side = THREE.DoubleSide;
    this.blending = THREE.AdditiveBlending;
  }
}
