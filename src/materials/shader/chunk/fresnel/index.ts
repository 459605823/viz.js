export const fresnel_pars_vertex = /* GLSL */ `
varying vec3 vView;
varying vec3 vNormal;
`;

export const fresnel_vertex = /* GLSL */ `
vView = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
vNormal = normalize(normalMatrix * normal);
`;

export const fresnel_pars_fragment = /* GLSL */ `
uniform vec3 diffuseColor;
uniform float fresnelIntensity;
uniform float fresnelExponent;

varying vec3 vView;
varying vec3 vNormal;
`;

export const fresnel_fragment = /* GLSL */ `
float fresnelValue = pow(fresnelIntensity - -min(dot(vView, normalize(vNormal)), 0.0), fresnelExponent);
vec4 fresnelColor = vec4(diffuseColor, fresnelValue);
`;

export const fresnel = {
  fresnel_pars_vertex,
  fresnel_vertex,
  fresnel_pars_fragment,
  fresnel_fragment,
};
