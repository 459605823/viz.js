import * as THREE from 'three'
// import vertexShader from './shader/vertex.glsl'
// import fragmentShader from './shader/fragment.glsl'
// import spark from './spark.png'
import {Component} from '@/manager/component'

function getPositionInSphere(radius: number) {
  const phi = Math.random() * Math.PI
  const theta = Math.random() * Math.PI * 2
  const r = Math.random() * radius
  const x = r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.sin(phi) * Math.sin(theta)
  const z = r * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

export interface Options {
  sphere?: {
    radius: number
    count: number
  }
  line?: {
    path: THREE.Vector3[]
    radius: number
    count: number
  }
  ring?: {
    ringRadius: number
    radius: number
    count: number
  }
}

export class Particle extends Component {
  options: Options

  constructor(options: Options) {
    super(options)
    this.options = options
  }

  create() {
    const {sphere} = this.options
    if (sphere) {
      this.object3D.add(this.createParticleBall(sphere.radius, sphere.count))
    }
  }

  createParticleBall(radius: number, pointCount: number) {
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const sizes = new Float32Array(pointCount)
    const color = new THREE.Color()
    for (let i = 0; i < pointCount; i++) {
      const vertex = getPositionInSphere(radius)
      vertex.toArray(positions, i * 3)
      color.setHSL((vertex.x + 1) / 2, (vertex.y + 1) / 2, (vertex.z + 1) / 2)
      color.toArray(colors, i * 3)
      sizes[i] = 1
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('vertexColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: '',
      fragmentShader: '',
      uniforms: {
        color: {
          value: new THREE.Color(0xFFFFFF),
        },
        pointTexture: {
          value: new THREE.TextureLoader().load('spark'),
        },
      },
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    })
    const particles = new THREE.Points(geometry, material)
    return particles
  }
}
