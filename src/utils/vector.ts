import type {Camera, Vector3} from 'three';
import {Vector2} from 'three';

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
