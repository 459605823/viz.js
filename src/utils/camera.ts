import {MathUtils} from 'three'

const {DEG2RAD, RAD2DEG} = MathUtils

// Converts horizontal FoV to vertical FoV.
export function calculateVerticalFoV(horizontalFoV: number, aspect = 16 / 9) {
  return (
    Math.atan(Math.tan(horizontalFoV * DEG2RAD * 0.5) / aspect) * RAD2DEG * 2.0
  )
}

// Converts vertical FoV to horizontal FoV.
export function calculateHorizontalFoV(verticalFoV: number, aspect = 16 / 9) {
  return (
    Math.atan(Math.tan(verticalFoV * DEG2RAD * 0.5) * aspect) * RAD2DEG * 2.0
  )
}
