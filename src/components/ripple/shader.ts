export const vertex = /* GLSL */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragment = /* GLSL */ `
uniform vec3 uColor;
uniform float uTime;       // elapsed time in ms
uniform float uDuration;   // total duration in ms
uniform float uMaxRadius;  // max ring radius in UV space (0-~0.707 from center)
uniform float uRingWidth;  // ring softness
uniform float uCenterSize; // center dot radius in UV space

varying vec2 vUv;

void main() {
  // normalize time (0..1) and wrap
  float t = mod(uTime, uDuration) / uDuration;
  float radius = uMaxRadius * t;

  // distance from center of plane (0.5, 0.5)
  float d = distance(vUv, vec2(0.5));

  // create a thin ring using smoothstep around target radius
  float inner = smoothstep(radius - uRingWidth, radius, d);
  float outer = smoothstep(radius, radius + uRingWidth, d);
  float ring = inner - outer; // peak at radius

  // fade out as radius grows (the further it expands, the lower the alpha)
  float fade = 1.0 - t;
  float alpha = ring * fade;

  // Always show a small dot at the very center
  float center = 1.0 - smoothstep(0.0, uCenterSize, d);
  alpha = max(alpha, center);

  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;
