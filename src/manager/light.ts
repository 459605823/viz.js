import * as THREE from 'three'
import Manager from './base'

export class LightManager extends Manager {
  readonly name = 'LightManager'

  dirLights: {
    light: THREE.DirectionalLight
    helper?: THREE.DirectionalLightHelper
  }[] = []

  spotLights: { light: THREE.SpotLight, helper?: THREE.SpotLightHelper }[] = []

  hemiSphereLights: {
    light: THREE.HemisphereLight
    helper?: THREE.HemisphereLightHelper
  }[] = []

  constructor() {
    super()
  }

  createAmbientLight(color = 0xFFFFFF, instensity = 1) {
    const light = new THREE.AmbientLight(color, instensity)
    this.pencil?.scene?.add(light)
    return light
  }

  createSpotLight(
    parameters: {
      color?: number | string
      intensity?: number
      distance?: number
      angle?: number
      penumbra?: number
      decay?: number
      position?: THREE.Vector3
      target?: THREE.Vector3
      helper?: boolean
    } = {},
  ) {
    const {
      color = 0xFFFFFF,
      intensity = 1,
      distance = 0,
      angle = Math.PI / 3,
      penumbra = 0,
      decay = 1,
      position = new THREE.Vector3(0, 0, 0),
      target = new THREE.Vector3(0, 0, 0),
      helper = false,
    } = parameters
    const light = new THREE.SpotLight(
      new THREE.Color(color),
      intensity,
      distance,
      angle,
      penumbra,
      decay,
    )
    light.position.copy(position!)
    light.target.position.copy(target!)
    this.pencil?.scene?.add(light)
    this.pencil?.scene?.add(light.target)
    let helperObj: THREE.SpotLightHelper | undefined
    if (helper) {
      helperObj = new THREE.SpotLightHelper(light)
      this.pencil?.scene?.add(helperObj)
    }

    if (this.pencil?.guiManager) {
      const folder = this.pencil.guiManager.addFolder(
        `聚光灯-${this.spotLights.length}`,
        {
          color: {
            label: '灯光颜色',
            value: color,
            onChange: (value: number) => {
              light.color.set(value)
              helperObj?.update()
            },
          },
          intensity: {
            label: '灯光强度',
            value: intensity,
            min: 0,
            max: 100,
            step: 0.01,
            onChange: (value: number) => {
              light.intensity = value
              helperObj?.update()
            },
          },
          distance: {
            label: '灯光距离',
            value: distance,
            min: 0,
            max: 1000,
            step: 1,
            onChange: (value: number) => {
              light.distance = value
              helperObj?.update()
            },
          },
          angle: {
            label: '灯光角度',
            value: angle,
            min: 0,
            max: Math.PI / 2,
            step: 0.01,
            onChange: (value: number) => {
              light.angle = value
              helperObj?.update()
            },
          },
          penumbra: {
            label: '灯光边缘软化',
            value: penumbra,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value: number) => {
              light.penumbra = value
              helperObj?.update()
            },
          },
          decay: {
            label: '灯光衰减',
            value: decay,
            min: 0,
            max: 2,
            step: 0.01,
            onChange: (value: number) => {
              light.decay = value
              helperObj?.update()
            },
          },
          position: {
            label: '灯光位置',
            target: () => light,
            min: -500,
            max: 500,
            step: 0.1,
            onChange: () => {
              helperObj?.update()
            },
          },
          target: {
            label: '灯光目标',
            value: target,
            min: -500,
            max: 500,
            step: 0.1,
            onChange: (value) => {
              light.target.position.copy(value)
              helperObj?.update()
            },
          },
        },
      )
      folder.expanded = false
    }

    this.spotLights.push({ light, helper: helperObj })
    return light
  }

  createDirectionalLight(
    parameters: {
      color?: string | number
      intensity?: number
      position?: THREE.Vector3
      target?: THREE.Vector3
      helper?: boolean
    } = {},
  ) {
    const {
      color = '#ffffff',
      intensity = 1,
      position = new THREE.Vector3(0, 0, 1),
      target = new THREE.Vector3(0, 0, 0),
      helper = false,
    } = parameters
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.copy(position)
    light.target.position.copy(target)
    this.pencil?.scene?.add(light)
    this.pencil?.scene?.add(light.target)
    let helperObj: THREE.DirectionalLightHelper | undefined
    if (helper) {
      helperObj = new THREE.DirectionalLightHelper(light)
      this.pencil?.scene?.add(helperObj)
    }

    if (this.pencil?.guiManager) {
      const folder = this.pencil.guiManager.addFolder(
        `平行光-${this.dirLights.length}`,
        {
          color: {
            label: '灯光颜色',
            value: color,
            onChange: (value: number) => {
              light.color.set(value)
              helperObj?.update()
            },
          },
          intensity: {
            label: '灯光强度',
            value: intensity,
            min: 0,
            max: 10,
            step: 0.01,
            onChange: (value: number) => {
              light.intensity = value
              helperObj?.update()
            },
          },
          position: {
            label: '灯光位置',
            target: () => light,
            min: -500,
            max: 500,
            step: 0.1,
            onChange: () => {
              helperObj?.update()
            },
          },
          target: {
            label: '灯光目标',
            value: target,
            min: -500,
            max: 500,
            step: 0.1,
            onChange: (value) => {
              light.target.position.copy(value)
              helperObj?.update()
            },
          },
        },
      )
      folder.expanded = false
    }

    this.dirLights.push({ light, helper: helperObj })
    return light
  }

  createHemisphereLight(
    parameters: {
      skyColor?: string | number
      groundColor?: string | number
      intensity?: number
      position?: THREE.Vector3
      helper?: boolean
    } = {},
  ) {
    const {
      skyColor = '#ffffff',
      groundColor = '#ffffff',
      intensity = 1,
      position = new THREE.Vector3(0, 0, 0),
      helper = false,
    } = parameters
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity)
    light.position.copy(position)
    this.pencil?.scene?.add(light)
    let helperObj: THREE.HemisphereLightHelper | undefined
    if (helper) {
      helperObj = new THREE.HemisphereLightHelper(light, 5)
      this.pencil?.scene?.add(helperObj)
    }

    if (this.pencil?.guiManager) {
      const folder = this.pencil.guiManager.addFolder(
        `半球光-${this.hemiSphereLights.length}`,
        {
          skyColor: {
            label: '天空颜色',
            value: skyColor,
            onChange: (value: number) => {
              light.color.set(value)
              helperObj?.update()
            },
          },
          groundColor: {
            label: '地面颜色',
            value: groundColor,
            onChange: (value: number) => {
              light.groundColor.set(value)
              helperObj?.update()
            },
          },
          intensity: {
            label: '灯光强度',
            value: intensity,
            min: 0,
            max: 10,
            step: 0.01,
            onChange: (value: number) => {
              light.intensity = value
              helperObj?.update()
            },
          },
          position: {
            label: '灯光位置',
            target: () => light,
            min: -500,
            max: 500,
            step: 0.1,
            onChange: () => {
              helperObj?.update()
            },
          },
        },
      )
      folder.expanded = false
    }

    this.hemiSphereLights.push({ light, helper: helperObj })
    return light
  }

  dispose() {
    super.dispose()
    this.dirLights.forEach(({ light, helper }) => {
      light.dispose()
      helper?.dispose()
    })
    this.spotLights.forEach(({ light, helper }) => {
      light.dispose()
      helper?.dispose()
    })
    this.hemiSphereLights.forEach(({ light, helper }) => {
      light.dispose()
      helper?.dispose()
    })
    this.dirLights.length = 0
    this.spotLights.length = 0
    this.hemiSphereLights.length = 0
  }
}
