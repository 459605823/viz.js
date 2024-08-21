import * as THREE from 'three'

export function disposeObject3D(object: THREE.Object3D) {
  if (object instanceof THREE.Group && object.children.length) {
    object.children.forEach((child) => {
      disposeObject3D(child)
    })
  }
  else if (object instanceof THREE.Mesh) {
    if (object.geometry) {
      object.geometry.dispose()
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => {
          material.dispose()
        })
      }
      else {
        object.material.dispose()
      }
    }
  }
}

export function getBounds(object: THREE.Object3D) {
  const box3 = new THREE.Box3().setFromObject(object)
  const center = box3.getCenter(new THREE.Vector3())
  const size = box3.getSize(new THREE.Vector3())
  const sphere = new THREE.Sphere()
  box3.getBoundingSphere(sphere)
  return {
    bbox: box3,
    sphere,
    center,
    size,
  }
}

export function hasObject(object: THREE.Object3D, parent: THREE.Object3D) {
  let has = false
  parent.traverse((child) => {
    if (child === object) {
      has = true
    }
  })
  return has
}

export function isObjectVisible(object: THREE.Object3D, camera: THREE.Camera, raycaster: THREE.Raycaster, occlude: THREE.Object3D[]) {
  const worldPosition = new THREE.Vector3()
  object.updateWorldMatrix(true, false)
  object.getWorldPosition(worldPosition)
  const screenPosition = worldPosition.clone()
  screenPosition.project(camera)
  // @ts-expect-error screenPosition is in NDC space
  raycaster.setFromCamera(screenPosition, camera)
  const intersects = raycaster.intersectObjects(occlude)
  if (intersects.length) {
    return intersects[0].object === object
  }
  else {
    return false
  }
}
