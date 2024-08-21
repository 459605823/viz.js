varying vec3 vView;
varying vec3 vNormal;

void main() {
  vView = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}