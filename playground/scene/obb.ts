import {ComponentManager, Viz, THREE, Component} from '@/index'

class OB extends Component {
  readonly name = 'OB'

  create() {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 1),
      new THREE.MeshBasicMaterial({color: 0xff0000}),
    )
    mesh.rotateY(Math.PI / 4)
    this.object3D = mesh
  }

  render() {
    this.showObbHelper()
  }
}

const componentManager = new ComponentManager({
  OB,
})

export default class Map {
  viz: Viz

  constructor(el: HTMLElement) {
    const viz = new Viz(
      {
        dev: true,
        grid: false,
        container: el,
      },
      {
        componentManager,
      },
    )
    this.viz = viz
  }

  async init() {
    const viz = this.viz
    await componentManager.draw('OB')
    viz.start()
  }

  dispose() {
    this.viz.dispose()
  }
}
