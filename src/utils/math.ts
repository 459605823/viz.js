import {MathUtils} from 'three';

const {DEG2RAD, RAD2DEG} = MathUtils;

// Converts horizontal FoV to vertical FoV.
export function calculateVerticalFoV(horizontalFoV: number, aspect = 16 / 9) {
  return (
    Math.atan(Math.tan(horizontalFoV * DEG2RAD * 0.5) / aspect) * RAD2DEG * 2.0
  );
}

// Converts vertical FoV to horizontal FoV.
export function calculateHorizontalFoV(verticalFoV: number, aspect = 16 / 9) {
  return (
    Math.atan(Math.tan(verticalFoV * DEG2RAD * 0.5) * aspect) * RAD2DEG * 2.0
  );
}

/**
 * 根据索引和总数计算圆周上的位置。
 * @param {number} index - 当前元素的索引。
 * @param {number} total - 元素的总数。
 * @param {number} radius - 圆的半径。
 * @returns {{x: number, y: number}} - 圆周上对应位置的 x 和 y 坐标。
 */
export function getCirclePosition(index: number, total: number, radius: number) {
  const angle = (index / total) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/**
 * 将经纬度转换为球面坐标。
 * @param {number} lon - 经度。
 * @param {number} lat - 纬度。
 * @param {number} radius - 球体的半径。
 * @returns {{x: number, y: number, z: number}} - 球面坐标的 x、y 和 z 坐标。
 */
export function lonlat2Spherical(lon: number, lat: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}
