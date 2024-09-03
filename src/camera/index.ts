import * as THREE from 'three';
import CameraControls from 'camera-controls';
import type {GuiManager} from '../manager';
import {calculateVerticalFoV} from '@/utils';

CameraControls.install({THREE});

export interface Options {
  width: number;
  height: number;
  domElement: HTMLElement;
  fov?: number;
  near?: number;
  far?: number;
  focalLength?: number;
  position?: THREE.Vector3;
  target?: THREE.Vector3;
}

export default (options: Options) => {
  const {
    width,
    height,
    domElement,
    fov = calculateVerticalFoV(90, Math.max(width / height, 16 / 9)),
    near = 0.1,
    far = 1000,
    position = new THREE.Vector3(0, 0, 10),
    target = new THREE.Vector3(0, 0, 0),
  } = options;
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
  if (options.focalLength) {
    camera.setFocalLength(options.focalLength);
  }
  const cameraControls = new CameraControls(camera, domElement);
  cameraControls.setLookAt(
    position.x,
    position.y,
    position.z,
    target.x,
    target.y,
    target.z,
  );
  return cameraControls;
};

export function setGUI(guiManager: GuiManager, cameraControl: CameraControls) {
  const folder = guiManager?.addFolder('Camera', {
    x: {
      value: cameraControl.camera.position.x,
      min: -500,
      max: 500,
      step: 0.1,
      onChange: (value) => {
        const position = cameraControl.getPosition(new THREE.Vector3());
        cameraControl.setPosition(value, position.y, position.z);
      },
    },
    y: {
      value: cameraControl.camera.position.y,
      min: -500,
      max: 500,
      step: 0.1,
      onChange: (value) => {
        const position = cameraControl.getPosition(new THREE.Vector3());
        cameraControl.setPosition(position.x, value, position.z);
      },
    },
    z: {
      value: cameraControl.camera.position.z,
      min: -500,
      max: 500,
      step: 0.1,
      onChange: (value) => {
        const position = cameraControl.getPosition(new THREE.Vector3());
        cameraControl.setPosition(position.x, position.y, value);
      },
    },
    near: {
      value: cameraControl.camera.near,
      min: 0,
      max: 30,
      step: 0.001,
      onChange: (value) => {
        cameraControl.camera.near = value;
        cameraControl.camera.updateProjectionMatrix();
      },
    },
    far: {
      value: cameraControl.camera.far,
      min: 0,
      max: 5000,
      step: 1,
      onChange: (value) => {
        cameraControl.camera.far = value;
        cameraControl.camera.updateProjectionMatrix();
      },
    },
  });
  folder.expanded = false;
  return folder;
}
