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
        renderer: {
          alpha: true,
          clearColor: new THREE.Color('#000'),
          clearAlpha: 0,
        }
        // scene: {
        //   background: new THREE.Color('#000'),
        // }
      },
      {
        componentManager,
      },
    )
    this.viz = viz
  }

  async init() {
    const viz = this.viz
    const pts: THREE.Vector3[] = [];
    const count = 500;
    for (let i = -count; i < count; i += 30) {
      pts.push(new THREE.Vector3(
        i + Math.random() * 10 - 5,
        (2 + Math.random() - 0.5) * (i % 2 === 0 ? 1 : -1),
        0,
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 1);
    const points = curve.getPoints(500);
    const texture = createLineTexture('rgba(255,255,255,0)', 'rgba(255,255,255,128)')
    const parabola = (x: number, k: number) => Math.pow(4 * x * (1 - x), k)
    // const line = await componentManager.draw('Line', {
    //   points,
    //   // wcb: (p) => {
    //   //   return parabola(p, 1)
    //   // },
    //   material: {
    //     sizeAttenuation: 1,
    //     lineWidth: 1,
    //     opacity: 1,
    //     color: 0x1350ef,
    //     dashOffset: 80,
    //     transparent: true,
    //   },
    //   // visibleLength: Math.random(),
    //   // animation: 'dash',
    // })
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 'red', transparent: true, opacity: 0.1}))
    viz.scene?.add(box)
    const line2 = await componentManager.draw('Line', {
      points,
      // wcb: (p) => {
      //   return parabola(p, 1)
      // },
      material: {
        // map: texture,
        // useMap: 1,
        color: 'rgba(0, 153, 255, 1)',
        // useFade: 1,
        // useDash: 1,
        // dashOffset: 0,
        // dashArray: 0.1 + Math.random() * 0.1,
        // dashRatio: 0.1 + Math.random() * 0.5,
        lineWidth: 1,
        opacity: 0.1,
        transparent: true,
        sizeAttenuation: 1,
        // blending: THREE.AdditiveBlending,
      },
      // visibleLength: 0.3,
      // speed: 0.001,
      // animation: 'dash',
    })
    let time = 0
    viz.requestAnimationFrame(() => {
      time += 0.016
      // line.setWaveTime(time)
      line2.setWaveTime(time)
    })
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
