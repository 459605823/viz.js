import {ComponentManager, Line, Viz, THREE} from '@/index'

const componentManager = new ComponentManager({
  Line,
})

function createLineTexture(lineColor: string, lightColor: string, lightLength = 0.4) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 256, 1)
  gradient.addColorStop(0, lineColor)
  gradient.addColorStop(lightLength / 2, lightColor)
  gradient.addColorStop(lightLength, lineColor)
  gradient.addColorStop(1, lineColor)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 1)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export default class Map {
  viz: Viz

  constructor(el: HTMLElement) {
    const viz = new Viz(
      {
        dev: true,
        container: el,
        scene: {
          background: new THREE.Color('#000'),
        },
        composer: {
          bloom: true,
        },
      },
      {
        componentManager,
      },
    )
    this.viz = viz
  }

  async init() {
    const viz = this.viz
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, 1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(2, 1, 0),
    ])
    const length = curve.getLength()
    const texture = createLineTexture('#ff2900', '#ffcb00', 0.4)
    const texture_test = new THREE.TextureLoader().load('/uv_grid_opengl.jpg')
    texture_test.wrapS = THREE.RepeatWrapping
    texture_test.wrapT = THREE.RepeatWrapping
    texture_test.repeat.set(2, 2)
    texture_test.colorSpace = THREE.SRGBColorSpace
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({map: texture_test}),
    )
    plane.position.set(0, 0, 0)
    viz.scene?.add(plane)
    const line = await componentManager.draw('Line', {
      points: curve.getPoints(100),
      wcb: (p) => {
       const a = Math.sin(p * Math.PI)
       return a * 2
      },
      material: {
        sizeAttenuation: 1,
        transparent: true,
        lineWidth: 0.1,
        color: '#fff',
        map: texture_test,
        useMap: 1,
        visibility: 0,
        dashArray: length,
        dashOffset: length,
        dashRatio: 0.8,
      },
      animation: {
        animationType: 'dash',
        duration: 2,
      },
    })
    viz.guiManager?.addFolder('texture', {
      x: {
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
        target: () => texture_test.offset,
      },
    })
    const light = await componentManager.draw('Line', {
      points: curve.getPoints(100),
      material: {
        color: '#ffcb00',
        sizeAttenuation: 1,
        transparent: true,
        lineWidth: 0.1,
        map: texture,
        useMap: 1,
      },
      animation: {
        duration: 1,
      },
    })
    line.animateIn(1)
    light.object3D.position.x = 4
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
