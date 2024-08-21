import * as THREE from 'three'
import { CSS2DRenderer, CSS3DRenderer } from 'three-stdlib'
import type { GuiManager } from '../manager'

export interface Options {
  width: number
  height: number
  dev?: boolean
  alpha?: boolean
  devicePixelRatio?: number
  toneMapping?: THREE.ToneMapping
  toneMappingExposure?: number
  colorSpace?: THREE.ColorSpace
}

export default (options: Options) => {
  const {
    dev,
    width,
    height,
    alpha = false,
    colorSpace = THREE.SRGBColorSpace,
    devicePixelRatio = Math.min(2, window.devicePixelRatio),
    toneMapping = THREE.LinearToneMapping,
    toneMappingExposure = 1,
  } = options
  const renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    alpha,
    antialias: false,
    stencil: false,
    depth: false,
  })
  renderer.debug.checkShaderErrors = dev ?? true
  renderer.outputColorSpace = colorSpace
  renderer.setSize(width, height)
  renderer.setPixelRatio(devicePixelRatio)
  renderer.toneMapping = toneMapping
  renderer.toneMappingExposure = toneMappingExposure
  return renderer
}

export function setGUI(guiManager: GuiManager, renderer: THREE.WebGLRenderer) {
  const folder = guiManager?.addFolder('Renderer', {
    toneMapping: {
      value: renderer.toneMapping,
      options: [
        { text: 'None', value: THREE.NoToneMapping },
        { text: 'Linear', value: THREE.LinearToneMapping },
        { text: 'Reinhard', value: THREE.ReinhardToneMapping },
        { text: 'Cineon', value: THREE.CineonToneMapping },
        { text: 'ACESFilmic', value: THREE.ACESFilmicToneMapping },
      ],
      onChange: (value) => {
        renderer.toneMapping = value
      },
    },
    toneMappingExposure: {
      value: renderer.toneMappingExposure,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (value) => {
        renderer.toneMappingExposure = value
      },
    },
  })
  folder.expanded = false
  return folder
}

export function createCSS2DRenderer(width: number, height: number) {
  const renderer = new CSS2DRenderer()
  renderer.setSize(width, height)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.pointerEvents = 'none'
  return renderer
}

export function createCSS3DRenderer(width: number, height: number) {
  const renderer = new CSS3DRenderer()
  renderer.setSize(width, height)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.pointerEvents = 'none'
  return renderer
}

export function createCSSRenderer(width: number, height: number, type?: '2d' | '3d' | 'both') {
  if (!type) {
    return []
  }
  if (type === '2d') {
    return [createCSS2DRenderer(width, height)]
  }
  if (type === '3d') {
    return [createCSS3DRenderer(width, height)]
  }
  return [
    createCSS2DRenderer(width, height),
    createCSS3DRenderer(width, height),
  ]
}
