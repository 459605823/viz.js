import './style.css'
import Scene from './scene/flyline'

const el = document.getElementById('app')
let scene: Scene

async function init() {
  if (el) {
    scene = new Scene(el)
    await scene.init()
  }
}

init()

window.onbeforeunload = () => {
  scene.dispose()
}
