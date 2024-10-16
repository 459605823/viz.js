import * as THREE from 'three';

export function isMaterialInUse(material: THREE.Material, currentObject: THREE.Object3D, scene?: THREE.Scene) {
  let used = false;
  if (!scene)
    return used;
  scene.traverse((object) => {
    if (object !== currentObject && object instanceof THREE.Mesh) {
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => {
          if (m === material) {
            used = true;
          }
        });
      } else {
        if (object.material === material) {
          used = true;
        }
      }
    }
  });
  return used;
}

export function disposeObject3D(object: THREE.Object3D, scene?: THREE.Scene) {
  if (object instanceof THREE.Group && object.children.length) {
    object.children.forEach((child) => {
      disposeObject3D(child, scene);
    });
  } else if (object instanceof THREE.Mesh) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => {
          if (!isMaterialInUse(material, object, scene)) {
            material.dispose();
          }
        });
      } else {
        if (!isMaterialInUse(object.material, object, scene)) {
          object.material.dispose();
        }
      }
    }
  }
}

export function getBounds(object: THREE.Object3D) {
  const box3 = new THREE.Box3().setFromObject(object);
  const size = box3.getSize(new THREE.Vector3());
  const sphere = new THREE.Sphere();
  box3.getBoundingSphere(sphere);
  return {
    boundingBox: box3,
    boundingSphere: sphere,
    size,
    center: sphere.center,
    radius: sphere.radius,
  };
}

export function hasObject(object: THREE.Object3D, parent: THREE.Object3D) {
  let has = false;
  parent.traverse((child) => {
    if (child === object) {
      has = true;
    }
  });
  return has;
}

export function isObjectVisible(object: THREE.Object3D, camera: THREE.Camera, raycaster: THREE.Raycaster, occlude: THREE.Object3D[]) {
  const worldPosition = new THREE.Vector3();
  object.updateWorldMatrix(true, false);
  object.getWorldPosition(worldPosition);
  const screenPosition = worldPosition.clone();
  screenPosition.project(camera);
  // @ts-expect-error screenPosition is in NDC space
  raycaster.setFromCamera(screenPosition, camera);
  const intersects = raycaster.intersectObjects(occlude);
  if (intersects.length) {
    return intersects[0].object === object;
  } else {
    return false;
  }
}
