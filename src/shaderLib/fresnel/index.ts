// import vertexShader from './vertex.glsl';
// import fragmentShader from './fragment.glsl';
import * as THREE from 'three'

function create(diffuseColor = new THREE.Color(0x0000FF), fresnelIntensity = 1.2, fresnelExponent = 3.5) {
  return new THREE.ShaderMaterial({
    vertexShader: '',
    fragmentShader: '',
    uniforms: {
      diffuseColor: {value: diffuseColor},
      fresnelIntensity: {value: fresnelIntensity},
      fresnelExponent: {value: fresnelExponent},
    },
    transparent: true,
  })
}

export {create}
