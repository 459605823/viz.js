// language=GLSL
export const vertex = /* GLSL */ `
varying vec3 vView;
varying vec3 vNormal;

void main() {
  vView = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// language=GLSL
export const fragment = /* GLSL */ `
uniform vec3 diffuseColor;
uniform float fresnelIntensity;
uniform float fresnelExponent;

varying vec3 vView;
varying vec3 vNormal;

void main() {
  float intensity = pow(fresnelIntensity - -min(dot(vView, normalize(vNormal)), 0.0), fresnelExponent);
  gl_FragColor = vec4(diffuseColor, intensity);
}
`;
