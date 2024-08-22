// language=GLSL
export const vertex = /* GLSL */ `
attribute float size;
attribute vec3 vertexColor;

varying vec3 vColor;

void main() {
  vColor = vertexColor;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = size * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
`

// language=GLSL
export const fragment = /* GLSL */ `
uniform vec3 color;
uniform sampler2D pointTexture;

varying vec3 vColor;

void main() {
  if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
  gl_FragColor = vec4( color * vColor, 1.0 );
  gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
}
`
