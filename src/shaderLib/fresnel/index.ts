import * as THREE from 'three'
import {fragment, vertex} from './shader'

function create(diffuseColor = new THREE.Color(0x0000FF), fresnelIntensity = 1.2, fresnelExponent = 3.5) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      diffuseColor: {value: diffuseColor},
      fresnelIntensity: {value: fresnelIntensity},
      fresnelExponent: {value: fresnelExponent},
    },
    transparent: true,
  })
}

export {create}
