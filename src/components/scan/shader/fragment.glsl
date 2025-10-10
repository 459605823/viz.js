uniform vec3 uColor;
uniform vec2 pointNum;
uniform float iTime;   // 0..1 循环
uniform float uAngle;  // 扫光方向（弧度）
uniform float uWidth;  // 扫光带宽度（UV 空间）
uniform float uDotScale;     // 点阵密度
uniform float uDotThreshold; // 点大小阈值
varying vec2 vUv;
void main(){
  // 旋转 UV，使得沿任意方向的扫光可统一映射到 ru.y 轴
  float c = cos(uAngle);
  float s = sin(uAngle);
  mat2 rot = mat2(c, -s, s, c);
  vec2 ru = rot * (vUv - 0.5) + 0.5;

  // 沿 ru.y 的周期性扫光中心（随时间在 [0,1) 内移动）
  float pos = ru.y;
  float center = fract(iTime);

  // 在环形（0..1）域上的最近距离
  float d1 = abs(pos - center);
  float d2 = 1.0 - d1;
  float d = min(d1, d2);

  // 根据距离生成带状 alpha，uWidth 控制厚度
  float band = 1.0 - smoothstep(uWidth, uWidth * 1.5, d);
  if (band < 0.001) discard;

  // 点阵效果（基于旋转后的 ru），不在点上则丢弃
  float dotDist = distance(fract(ru * pointNum * uDotScale), vec2(0.5));
  if (dotDist > uDotThreshold) discard;

  gl_FragColor = vec4(uColor, band);
}