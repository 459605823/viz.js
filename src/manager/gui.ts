import {Vector2, Vector3} from 'three'
import type {FolderApi} from 'tweakpane'
import {Pane} from 'tweakpane'
import Manager from './base'

export interface GuiParam {
  value?: number | string | boolean | Vector2 | Vector3
  label?: string
  min?: number
  max?: number
  step?: number
  options?: ({text: string, value: any} | string)[]
  onChange?: (value: any) => void
  target?: () => any
}

export type GuiParams = Record<string, GuiParam>

export class GuiManager extends Manager {
  readonly name = 'GuiManager'

  pane: Pane

  constructor() {
    super()
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.top = '8px'
    container.style.right = '8px'
    container.style.bottom = '8px'
    container.style.width = '256px'
    container.style.zIndex = '9999'
    container.style.overflowY = 'auto'
    document.body.appendChild(container)
    this.pane = new Pane({
      title: '控制面板',
      container,
    })
  }

  addFolder(title: string, config: GuiParams, open = false) {
    const f = this.pane.addFolder({
      title,
    })
    Object.keys(config).forEach((key) => {
      this.addBinding(key, config[key], f)
    })
    f.expanded = open
    return f
  }

  addBinding(key: string, config: GuiParam, folder?: FolderApi) {
    const {value, label, min, max, step, options, target, onChange} = config
    const params = target ? target() : {[key]: value}
    const isColor = key.toLowerCase().includes('color')
    const isPoint
      = params[key] instanceof Vector2 || params[key] instanceof Vector3
    let b
    const f = folder ?? this.pane
    if (isColor) {
      b = f.addBinding(params, key, {
        label: label ?? key,
        color: {type: 'float'},
      })
    }
    else if (isPoint) {
      b = this.addPoint(key, params, min, max, step, label, f)
    }
    else {
      b = f.addBinding(params, key, {
        label: label ?? key,
        min,
        max,
        step,
        options: options?.map(item =>
          typeof item === 'string' ? {text: item, value: item} : item,
        ),
      })
    }
    b.on('change', e => onChange?.(e.value))
    return b
  }

  addPoint(
    key: string,
    params: any,
    min?: number,
    max?: number,
    step?: number,
    label?: string,
    folder?: FolderApi,
  ) {
    const f = folder ?? this.pane
    const keys = Object.keys(params[key])
    const range = keys.reduce(
      (acc, k) => {
        acc[k] = {min, max, step}
        return acc
      },
      {} as Record<string, {min?: number, max?: number, step?: number}>,
    )
    const b = f.addBinding(params, key, {
      label: label ?? key,
      ...range,
    })
    return b
  }

  addButton(title: string, onClick: () => void, folder?: FolderApi) {
    const f = folder ?? this.pane
    f.addButton({
      title,
    }).on('click', onClick)
  }

  exportConfig() {
    const state = this.pane.exportState()
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  importConfig(config: string) {
    this.pane.importState(JSON.parse(config))
  }

  findFolder(title: string) {
    return this.pane.children.find(
      child => (child as FolderApi).title === title,
    )
  }

  update() {
    // this.pane.refresh();
  }

  dispose() {
    this.pane.dispose()
    super.dispose()
  }
}
