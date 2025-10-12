import {ComponentManager, Line, Viz, THREE} from '@/index'

const componentManager = new ComponentManager({
  Line,
})

function createLineTexture(lineColor: string, lightColor: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 256, 1)
  gradient.addColorStop(0, lineColor)
  gradient.addColorStop(0.5, lightColor)
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
        }
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
      new THREE.Vector3(-5, 1, 0),
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(5, 1, 0),
    ])
    const texture = createLineTexture('rgba(255,255,255,0)', 'rgba(255,255,255,128)')
    const parabola = (x: number, k: number) => Math.pow(4 * x * (1 - x), k)
    const line = await componentManager.draw('Line', {
      points: curve.getPoints(100),
      // wcb: (p) => {
      //   return parabola(p, 1)
      // },
      material: {
        sizeAttenuation: 1,
        lineWidth: Math.random() * 0.3 + 0.2,
        opacity: 0.1,
        color: 0x1350ef,
        dashOffset: 80,
        transparent: true,
      },
      // visibleLength: Math.random(),
      // animation: 'dash',
    })
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshBasicMaterial({color: '#f00'}),
    )
    viz.scene?.add(box)
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
