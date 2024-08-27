import * as THREE from 'three';
import {fragment, vertex} from './shader';

interface FresnelMaterialParameters {
  diffuseColor?: THREE.Color;
  fresnelIntensity?: number;
  fresnelExponent?: number;
}

export class FresnelMaterial extends THREE.ShaderMaterial {
  constructor(parameters: FresnelMaterialParameters) {
    const {diffuseColor = new THREE.Color(0x0000FF), fresnelIntensity = 1.2, fresnelExponent = 3.5} = parameters;
    super({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        diffuseColor: {value: diffuseColor},
        fresnelIntensity: {value: fresnelIntensity},
        fresnelExponent: {value: fresnelExponent},
      },
      transparent: true,
    });
  }
}
