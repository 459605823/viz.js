import type {Camera, Vector3} from 'three';
import {MathUtils, Vector2} from 'three';
import {makeNoise2D, makeNoise3D, makeNoise4D} from 'open-simplex-noise';

const {DEG2RAD, RAD2DEG} = MathUtils;

export const noise2d = makeNoise2D(8618641);
export const noise3d = makeNoise3D(3745842);
export const noise4d = makeNoise4D(8622739);

/**
 * 将 three.js 中的 Vector3 坐标转换成屏幕坐标
 * @param {Vector3} vector - 需要转换的 Vector3 坐标
 * @param {Camera} camera - 当前场景使用的相机
 * @param {number} width - 渲染器的宽度
 * @param {number} height - 渲染器的高度
 * @returns {Vector2} - 转换后的屏幕坐标
 */
export function vector3ToScreenPosition(vector: Vector3, camera: Camera, width: number, height: number): Vector2 {
  // 创建一个新的 Vector3 对象来存储转换后的坐标
  const vectorCopy = vector.clone();
  // 使用相机的投影矩阵将 Vector3 坐标转换为标准化设备坐标 (NDC)
  vectorCopy.project(camera);
  // 将标准化设备坐标 (NDC) 转换为屏幕坐标
  const x = (vectorCopy.x + 1) * width / 2;
  const y = (-vectorCopy.y + 1) * height / 2;
  return new Vector2(x, y);
}

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
