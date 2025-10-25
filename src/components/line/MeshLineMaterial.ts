import * as THREE from 'three';

const vertexShader = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  #include <fog_pars_vertex>
  #include <clipping_planes_pars_vertex>

  attribute vec3 previous;
  attribute vec3 next;
  attribute float side;
  attribute float width;
  attribute float counters;

  uniform vec2 resolution;
  uniform float lineWidth;
  uniform vec3 color;
  uniform float opacity;
  uniform float sizeAttenuation;
  uniform float useWave;
  uniform float time;
  uniform float animationSpeed;
  uniform float waveFrequency;
  uniform float waveAmplitude;

  varying vec2 vUV;
  varying vec4 vColor;
  varying float vCounters;

  vec2 fix(vec4 i, float aspect) {
    vec2 res = i.xy / i.w;
    res.x *= aspect;
    return res;
  }

  void main() {
    float aspect = resolution.x / resolution.y;
    vColor = vec4(color, opacity);
    vUV = uv;
    vCounters = counters;
    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 finalPosition = m * vec4(position, 1.0) * aspect;

    if (useWave == 1.) {
      vec3 wavePosition = position;
      wavePosition.y -= (sin(time * animationSpeed + lineWidth + position.y / waveFrequency + position.x / waveFrequency) * waveAmplitude + waveAmplitude) * position.y;
      finalPosition = m * vec4(wavePosition, 1.0) * aspect;
    }

    vec4 prevPos = m * vec4(previous, 1.0);
    vec4 nextPos = m * vec4(next, 1.0);

    vec2 currentP = fix(finalPosition, aspect);
    vec2 prevP = fix(prevPos, aspect);
    vec2 nextP = fix(nextPos, aspect);

    float w = lineWidth * width;

    vec2 dir;
    if (nextP == currentP) dir = normalize(currentP - prevP);
    else if (prevP == currentP) dir = normalize(nextP - currentP);
    else {
      vec2 dir1 = normalize(currentP - prevP);
      vec2 dir2 = normalize(nextP - currentP);
      dir = normalize(dir1 + dir2);

      vec2 perp = vec2(-dir1.y, dir1.x);
      vec2 miter = vec2(-dir.y, dir.x);
      //w = clamp(w / dot(miter, perp), 0., 4. * lineWidth * width);
    }

    //vec2 normal = (cross(vec3(dir, 0.), vec3(0., 0., 1.))).xy;
    vec4 normal = vec4(-dir.y, dir.x, 0., 1.);
    normal.xy *= .5 * w;
    //normal *= projectionMatrix;
    if (sizeAttenuation == 0.) {
      normal.xy *= finalPosition.w;
      normal.xy /= (vec4(resolution, 0., 1.) * projectionMatrix).xy * aspect;
    }

    finalPosition.xy += normal.xy * side;
    gl_Position = finalPosition;
    #include <logdepthbuf_vertex>
    #include <fog_vertex>
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    #include <clipping_planes_vertex>
    #include <fog_vertex>
  }
`;

const version = /* @__PURE__ */ (() =>
  Number.parseInt(THREE.REVISION.replace(/\D+/g, '')))();
const colorspace_fragment
  = version >= 154 ? 'colorspace_fragment' : 'encodings_fragment';

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>

  uniform sampler2D map;
  uniform sampler2D alphaMap;
  uniform float useGradient;
  uniform float useMap;
  uniform float useAlphaMap;
  uniform float useDash;
  uniform float useFade;
  uniform float dashArray;
  uniform float dashOffset;
  uniform float dashRatio;
  uniform float visibility;
  uniform float alphaTest;
  uniform vec2 repeat;
  uniform vec2 offset;
  uniform vec3 gradient[2];

  varying vec2 vUV;
  varying vec4 vColor;
  varying float vCounters;

  void main() {
    #include <logdepthbuf_fragment>
    vec4 diffuseColor = vColor;
    if (useGradient == 1.) diffuseColor = vec4(mix(gradient[0], gradient[1], vCounters), 1.0);
    if (useMap == 1.) diffuseColor *= texture2D(map, vUV * repeat + offset);
    if (useAlphaMap == 1.) diffuseColor.a *= texture2D(alphaMap, vUV * repeat + offset).a;
    if (diffuseColor.a < alphaTest) discard;
    if (useDash == 1.) {
      if (useFade == 1.) {
        float dashPos = mod(vCounters + dashOffset, dashArray);
        float solidLength = dashArray * dashRatio;
        float isInSolid = step(dashPos, solidLength);
        if (isInSolid > 0.5) {
          float t = dashPos / solidLength;
          diffuseColor.a *= (1.0 - t);
        } else {
          diffuseColor.a = 0.0;
        }
      } else {
        diffuseColor.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));
      }
    }
    diffuseColor.a *= step(vCounters, visibility);
    #include <clipping_planes_fragment>
    gl_FragColor = diffuseColor;
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <${colorspace_fragment}>
  }
`;

export interface MeshLineMaterialParameters {
  lineWidth?: number;
  map?: THREE.Texture;
  useMap?: number;
  alphaMap?: THREE.Texture;
  useAlphaMap?: number;
  color?: string | THREE.Color | number;
  gradient?: string[] | THREE.Color[] | number[];
  opacity?: number;
  resolution: THREE.Vector2; // required
  sizeAttenuation?: number;
  dashArray?: number;
  dashOffset?: number;
  dashRatio?: number;
  useDash?: number;
  useFade?: number;
  useWave?: number;
  useGradient?: number;
  visibility?: number;
  alphaTest?: number;
  repeat?: THREE.Vector2;
  offset?: THREE.Vector2;
  time?: number;
  animationSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
}

export class MeshLineMaterial
  extends THREE.ShaderMaterial
  implements MeshLineMaterialParameters {
  lineWidth!: number;
  map!: THREE.Texture;
  useMap!: number;
  alphaMap!: THREE.Texture;
  useAlphaMap!: number;
  color!: THREE.Color;
  gradient!: THREE.Color[];
  resolution!: THREE.Vector2;
  sizeAttenuation!: number;
  dashArray!: number;
  dashOffset!: number;
  dashRatio!: number;
  useDash!: number;
  useFade!: number;
  useWave!: number;
  useGradient!: number;
  visibility!: number;
  repeat!: THREE.Vector2;
  offset!: THREE.Vector2;
  time!: number;
  animationSpeed!: number;
  waveFrequency!: number;
  waveAmplitude!: number;

  constructor(parameters: MeshLineMaterialParameters) {
    super({
      uniforms: {
        ...THREE.UniformsLib.fog,
        lineWidth: {value: 1},
        map: {value: null},
        useMap: {value: 0},
        alphaMap: {value: null},
        useAlphaMap: {value: 0},
        color: {value: new THREE.Color(0xFFFFFF)},
        gradient: {
          value: [new THREE.Color(0xFF0000), new THREE.Color(0x00FF00)],
        },
        opacity: {value: 1},
        resolution: {value: new THREE.Vector2(1, 1)},
        sizeAttenuation: {value: 1},
        dashArray: {value: 0},
        dashOffset: {value: 0},
        dashRatio: {value: 0.5},
        useDash: {value: 0},
        useFade: {value: 0},
        useWave: {value: 0},
        useGradient: {value: 0},
        visibility: {value: 1},
        alphaTest: {value: 0},
        repeat: {value: new THREE.Vector2(1, 1)},
        offset: {value: new THREE.Vector2(0, 0)},
        time: {value: 0},
        animationSpeed: {value: 0.5},
        waveFrequency: {value: 10},
        waveAmplitude: {value: 0.5},
      },
      vertexShader,
      fragmentShader,
    });

    this.type = 'MeshLineMaterial';
    Object.defineProperties(this, {
      lineWidth: {
        enumerable: true,
        get() {
          return this.uniforms.lineWidth.value;
        },
        set(value) {
          this.uniforms.lineWidth.value = value;
        },
      },
      map: {
        enumerable: true,
        get() {
          return this.uniforms.map.value;
        },
        set(value) {
          this.uniforms.map.value = value;
        },
      },
      useMap: {
        enumerable: true,
        get() {
          return this.uniforms.useMap.value;
        },
        set(value) {
          this.uniforms.useMap.value = value;
        },
      },
      alphaMap: {
        enumerable: true,
        get() {
          return this.uniforms.alphaMap.value;
        },
        set(value) {
          this.uniforms.alphaMap.value = value;
        },
      },
      useAlphaMap: {
        enumerable: true,
        get() {
          return this.uniforms.useAlphaMap.value;
        },
        set(value) {
          this.uniforms.useAlphaMap.value = value;
        },
      },
      color: {
        enumerable: true,
        get() {
          return this.uniforms.color.value;
        },
        set(value) {
          this.uniforms.color.value = value;
        },
      },
      gradient: {
        enumerable: true,
        get() {
          return this.uniforms.gradient.value;
        },
        set(value) {
          this.uniforms.gradient.value = value;
        },
      },
      opacity: {
        enumerable: true,
        get() {
          return this.uniforms.opacity.value;
        },
        set(value) {
          this.uniforms.opacity.value = value;
        },
      },
      resolution: {
        enumerable: true,
        get() {
          return this.uniforms.resolution.value;
        },
        set(value) {
          this.uniforms.resolution.value.copy(value);
        },
      },
      sizeAttenuation: {
        enumerable: true,
        get() {
          return this.uniforms.sizeAttenuation.value;
        },
        set(value) {
          this.uniforms.sizeAttenuation.value = value;
        },
      },
      time: {
        enumerable: true,
        get() {
          return this.uniforms.time.value;
        },
        set(value) {
          this.uniforms.time.value = value;
        },
      },
      dashArray: {
        enumerable: true,
        get() {
          return this.uniforms.dashArray.value;
        },
        set(value) {
          this.uniforms.dashArray.value = value;
          this.useDash = value !== 0 ? 1 : 0;
        },
      },
      dashOffset: {
        enumerable: true,
        get() {
          return this.uniforms.dashOffset.value;
        },
        set(value) {
          this.uniforms.dashOffset.value = value;
        },
      },
      dashRatio: {
        enumerable: true,
        get() {
          return this.uniforms.dashRatio.value;
        },
        set(value) {
          this.uniforms.dashRatio.value = value;
        },
      },
      useDash: {
        enumerable: true,
        get() {
          return this.uniforms.useDash.value;
        },
        set(value) {
          this.uniforms.useDash.value = value;
        },
      },
      useFade: {
        enumerable: true,
        get() {
          return this.uniforms.useFade.value;
        },
        set(value) {
          this.uniforms.useFade.value = value;
        },
      },
      useWave: {
        enumerable: true,
        get() {
          return this.uniforms.useWave.value;
        },
        set(value) {
          this.uniforms.useWave.value = value;
        },
      },
      useGradient: {
        enumerable: true,
        get() {
          return this.uniforms.useGradient.value;
        },
        set(value) {
          this.uniforms.useGradient.value = value;
        },
      },
      visibility: {
        enumerable: true,
        get() {
          return this.uniforms.visibility.value;
        },
        set(value) {
          this.uniforms.visibility.value = value;
        },
      },
      alphaTest: {
        enumerable: true,
        get() {
          return this.uniforms.alphaTest.value;
        },
        set(value) {
          this.uniforms.alphaTest.value = value;
        },
      },
      repeat: {
        enumerable: true,
        get() {
          return this.uniforms.repeat.value;
        },
        set(value) {
          this.uniforms.repeat.value.copy(value);
        },
      },
      offset: {
        enumerable: true,
        get() {
          return this.uniforms.offset.value;
        },
        set(value) {
          this.uniforms.offset.value.copy(value);
        },
      },
      animationSpeed: {
        enumerable: true,
        get() {
          return this.uniforms.animationSpeed.value;
        },
        set(value) {
          this.uniforms.animationSpeed.value = value;
        },
      },
      waveFrequency: {
        enumerable: true,
        get() {
          return this.uniforms.waveFrequency.value;
        },
        set(value) {
          this.uniforms.waveFrequency.value = value;
        },
      },
      waveAmplitude: {
        enumerable: true,
        get() {
          return this.uniforms.waveAmplitude.value;
        },
        set(value) {
          this.uniforms.waveAmplitude.value = value;
        },
      },
    });
    this.setValues(parameters);
  }

  copy(source: MeshLineMaterial): this {
    super.copy(source);
    this.lineWidth = source.lineWidth;
    this.map = source.map;
    this.useMap = source.useMap;
    this.alphaMap = source.alphaMap;
    this.useAlphaMap = source.useAlphaMap;
    this.color.copy(source.color);
    this.gradient = source.gradient;
    this.opacity = source.opacity;
    this.resolution.copy(source.resolution);
    this.sizeAttenuation = source.sizeAttenuation;
    this.time = source.time;
    this.dashArray = source.dashArray;
    this.dashOffset = source.dashOffset;
    this.dashRatio = source.dashRatio;
    this.useDash = source.useDash;
    this.useFade = source.useFade;
    this.useWave = source.useWave;
    this.useGradient = source.useGradient;
    this.visibility = source.visibility;
    this.alphaTest = source.alphaTest;
    this.repeat.copy(source.repeat);
    this.offset.copy(source.offset);
    this.animationSpeed = source.animationSpeed;
    this.waveFrequency = source.waveFrequency;
    this.waveAmplitude = source.waveAmplitude;
    return this;
  }
}
