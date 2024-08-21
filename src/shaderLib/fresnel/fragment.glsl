uniform vec3 diffuseColor;
uniform float fresnelIntensity;
uniform float fresnelExponent;

varying vec3 vView;
varying vec3 vNormal;

void main() {
  float intensity = pow(fresnelIntensity - -min(dot(vView, normalize(vNormal)), 0.0), fresnelExponent);
  gl_FragColor = vec4(diffuseColor, intensity);
}