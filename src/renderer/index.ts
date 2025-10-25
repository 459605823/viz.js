import * as THREE from 'three';
import {CSS2DRenderer, CSS3DRenderer} from 'three-stdlib';

export interface Options {
  width: number;
  height: number;
  dev?: boolean;
  alpha?: boolean;
  devicePixelRatio?: number;
  clearColor?: THREE.Color;
  clearAlpha?: number;
  colorSpace?: THREE.ColorSpace;
  antialias?: boolean;
  postProcess?: boolean;
}

export default (options: Options) => {
  const {
    dev,
    width,
    height,
    alpha = false,
    colorSpace = THREE.SRGBColorSpace,
    devicePixelRatio = Math.min(2, window.devicePixelRatio),
    antialias = true,
    postProcess = false,
  } = options;
  const renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    alpha,
    antialias: postProcess ? false : antialias,
    stencil: false,
    depth: !postProcess,
  });
  renderer.debug.checkShaderErrors = dev ?? true;
  renderer.outputColorSpace = colorSpace;
  renderer.setSize(width, height);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.toneMapping = THREE.NoToneMapping;
  if (options.clearColor !== undefined) {
    renderer.setClearColor(options.clearColor, options.clearAlpha ?? 1);
  }
  return renderer;
};

export function createCSS2DRenderer(width: number, height: number) {
  const renderer = new CSS2DRenderer();
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.pointerEvents = 'none';
  return renderer;
}

export function createCSS3DRenderer(width: number, height: number) {
  const renderer = new CSS3DRenderer();
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.pointerEvents = 'none';
  return renderer;
}

export function createCSSRenderer(width: number, height: number, type?: '2d' | '3d' | 'both') {
  if (!type) {
    return [];
  }
  if (type === '2d') {
    return [createCSS2DRenderer(width, height)];
  }
  if (type === '3d') {
    return [createCSS3DRenderer(width, height)];
  }
  return [
    createCSS2DRenderer(width, height),
    createCSS3DRenderer(width, height),
  ];
}
