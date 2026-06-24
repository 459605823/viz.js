---
name: vizjs-usage
description: 'Guide for using the viz.js 3D visualization library. Use when: creating new components, working with Viz class, using ComponentManager/AssetManager, writing Three.js scenes, adding new visual effects, implementing animation loops, loading assets, handling interactions. Triggers: "create component", "add scene", "use viz.js", "add animation", "load asset", "create manager".'
---

# viz.js Library Usage Guide

viz.js is a high-level 3D visualization framework built on Three.js. Always read `src/Viz.ts` and the relevant component/manager source before making changes.

## Core Patterns

### 1. Initialize Viz

```typescript
import {ComponentManager, THREE, Viz} from '@/index';

// Register only the components you need
const componentManager = new ComponentManager({Line, ExtrudeMap});

const viz = new Viz(
  {
    container: el, // HTMLElement
    dev: true, // enables axes, grid, stats, GuiManager
    staticPath: '/assets/', // prefix for all asset URLs
    scene: {background: new THREE.Color('#000')},
    renderer: {alpha: false},
    camera: {/* CameraOptions */},
  },
  {componentManager}, // register custom managers here
);
```

**Key `Viz` options:**
| Option | Default | Purpose |
|--------|---------|---------|
| `dev` | `false` | Axes, grid, stats, GuiManager |
| `staticPath` | `''` | Asset URL prefix |
| `cssRenderer` | — | `'2d'` / `'3d'` / `'both'` |
| `composer` | — | Post-processing pass options |

**Built-in manager accessors:**
- `viz.assetManager` — load textures, GLTF, JSON, HDR
- `viz.interactionManager` — mouse raycasting events
- `viz.cameraControl` — camera-controls instance
- `viz.guiManager` — Tweakpane GUI (only when `dev: true`)

---

### 2. Start the Render Loop

```typescript
viz.start(); // basic start

viz.start({
  fn: (delta, elapsedTime) => {/* per-frame logic */},
  frameRate: 30, // cap at 30 fps
});

// Add callbacks after start()
viz.requestAnimationFrame((delta, elapsedTime) => {
  mesh.rotation.y += delta;
}, {once: false, duration: 5000, order: 0});
```

---

### 3. Load Assets with AssetManager

```typescript
viz.assetManager.setAsset([
  {type: 'json', url: '/geojson/world.json'},
  {type: 'texture', url: '/textures/earth.jpg'},
  {type: 'gltf', url: '/models/city.glb'},
  {type: 'hdr', url: '/env/sunset.hdr', version: '1.0.0'}, // cached in IndexedDB
]);

await viz.assetManager.load();

const geojson = await viz.assetManager.getAsset('/geojson/world.json');
const texture = await viz.assetManager.getAsset('/textures/earth.jpg');
```

**Asset types:** `'gltf'` | `'texture'` | `'json'` | `'video'` | `'hdr'` | `'exr'`
Set `version` to enable IndexedDB caching.

---

### 4. Use ComponentManager to Draw Components

```typescript
const componentManager = new ComponentManager({ExtrudeMap, Line, Billboard});

// Register it to viz
const viz = new Viz({...}, {componentManager});

// Draw (async, returns the component instance)
const map = await componentManager.draw('ExtrudeMap', {
  projection,
  depth: 0.1,
  geojson: geojson as any,
});

// Wait for all pending draws
await Promise.all(componentManager.componentPromise);

// Fit camera to a component
viz.cameraControl?.fitToBox(map.boundingBox, false);

// Get an existing instance
const existing = componentManager.getInstance('ExtrudeMap');
const specific  = componentManager.getInstance('Billboard', 'my-key');
```

---

### 5. Built-in Components

| Component | Key Options |
|-----------|-------------|
| `Line` | `points`, `material`, `visibleLength`, `speed`, `animation` |
| `ExtrudeMap` | `projection`, `depth`, `geojson`, `faceMaterial`, `sideMaterial`, `outline` |
| `Particle` | see `src/components/particle/index.ts` |
| `Billboard` | `position`, `text` |
| `Marker` | see `src/components/marker/index.ts` |
| `GeoMesh` | see `src/components/geoMesh/index.ts` |
| `Scan` | see `src/components/scan/index.ts` |
| `Ripple` | see `src/components/ripple/index.ts` |

All components export their `Options` interface — import and check it before writing code.

---

### 6. Create a New Component

Follow these steps exactly:

1. **Create directory**: `src/components/<name>/`
2. **Create `index.ts`** with a named export (not default):

```typescript
import * as THREE from 'three';
import {Component} from '@/manager/component';

export interface MyCompOptions {
  color: string;
  position?: THREE.Vector3;
}

export class MyComp extends Component<MyCompOptions> {
  readonly name = 'MyComp';

  create() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshBasicMaterial({color: this.options.color});
    this.object3D.add(new THREE.Mesh(geo, mat));
    if (this.options.position) {
      this.object3D.position.copy(this.options.position);
    }
  }

  update(delta: number, elapsedTime: number) {
    this.object3D.rotation.y += delta;
  }

  dispose() {
    super.dispose(); // always call super
    // dispose geometries and materials here
  }
}
```

3. **Export from** `src/components/index.ts`:
```typescript
export {MyComp, type MyCompOptions} from './myComp';
```

4. **Component lifecycle** (called by `ComponentManager`):
   - `create()` — build `this.object3D`
   - `render()` — optional post-create setup
   - `update(delta, elapsedTime)` — every frame
   - `dispose()` — cleanup (always call `super.dispose()`)

---

### 7. Create a Custom Manager

```typescript
import Manager from '@/manager/base';
import type {Viz} from '@/Viz';

export class MyManager extends Manager {
  readonly name = 'MyManager';
  private viz!: Viz;

  install(viz: Viz) {
    this.viz = viz;
  }

  update(delta: number, elapsedTime: number) {
    // called every frame
  }

  setSize(width: number, height: number) {}

  dispose() {}
}

// Register it
viz.registerManager('myManager', new MyManager());

// Access it
const mgr = viz.getManager('myManager') as MyManager;
```

---

### 8. Event Handling

Both `Viz` and `Component` extend `EventDispatcher`:

```typescript
// Emit
this.emit('ready', {data: 123});

// Listen
viz.on('ready', payload => console.log(payload.data));
component.on('click', handler);
```

`InteractionManager` provides Three.js raycasting. Use `viz.interactionManager` for mouse events.

---

## Code Style Rules

- **Semicolons**: always use `;`
- **Curly braces**: NO spaces inside `{key: 'value'}`, NOT `{ key: 'value' }`
- **Brace style**: 1tbs
- **Imports**: use `@/` alias for `src/`; `import * as THREE from 'three'`
- **Types**: strict mode — no `any` unless unavoidable; use `KeyOf<T>`, `Nullable<T>` from `@/types/utils`
- **Exports**: named exports (`export class Foo`), not `export default`
- Run `pnpm lint:fix` to auto-format after edits

---

## Common Gotchas

- `viz.start()` must be called after all assets are loaded and components are drawn.
- `await Promise.all(componentManager.componentPromise)` ensures all async draws are complete before camera fitting.
- `showBoundingBox()` / `showObbHelper()` only work when `dev: true`.
- `staticPath` is prepended automatically by `assetManager.getAsset()` — don't duplicate it in URLs.
- Always call `super.dispose()` in component `dispose()` to clean up helpers.
- `ComponentManager` must be registered with the correct component class map — only registered components can be drawn.

---

## Reference Files

- [Viz.ts](../../../src/Viz.ts) — main class
- [manager/component.ts](../../../src/manager/component.ts) — Component base + ComponentManager
- [manager/asset.ts](../../../src/manager/asset.ts) — AssetManager
- [manager/base.ts](../../../src/manager/base.ts) — Manager base class
- [components/index.ts](../../../src/components/index.ts) — all exported components
- [playground/scene/](../../../playground/scene/) — real usage examples
