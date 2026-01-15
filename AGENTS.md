# AI Coding Agent Guide for Viz.js

This document provides a comprehensive guide for AI agents working on the `viz.js` codebase. It outlines the project structure, architectural patterns, coding standards, and development workflows.

## 1. Project Overview

`viz.js` is a high-level visualization framework built on top of [Three.js](https://threejs.org/). It simplifies the creation of 3D data visualizations by providing a structured system of Managers, Components, and Utilities.

### Tech Stack

- **Languages**: TypeScript (Strict Mode)
- **Core Library**: Three.js (via `@types/three`, `three-stdlib`)
- **Build Tool**: Vite, Unbuild
- **Package Manager**: pnpm
- **Environment**: Node.js >= 20
- **Utilities**: `gsap` (animations), `tweakpane` (GUI), `camera-controls`

## 2. Directory Structure

- **`src/`**: Source code of the library.
  - **`Viz.ts`**: The main entry class `Viz`.
  - **`components/`**: Reusable 3D components (e.g., `Line`, `Map`, `Particle`).
  - **`manager/`**: Core systems (e.g., `InteractionManager`, `AssetManager`).
  - **`materials/`**: Custom shaders and materials.
  - **`scene/`**, **`camera/`**, **`renderer/`**: Factories/setup logic.
  - **`helpers/`**: Helper classes like `EventDispatcher`.
  - **`utils/`**: General utility functions.
- **`playground/`**: A dev environment app to test the library features.
  - **`scene/`**: Example scenes using the library.
- **`geojson/`**: GeoJSON data for map visualizations.

## 3. Core Architecture

The framework revolves around the `Viz` class, which orchestrates the Scene, Camera, Renderer, and a collection of Managers.

### 3.1. The `Viz` Class (`src/Viz.ts`)

- **Role**: Central controller.
- **Key Properties**:
  - `scene`: The THREE.Scene.
  - `renderer`: The THREE.WebGLRenderer.
  - `camera`: The THREE.PerspectiveCamera (w/ CameraControls).
  - `managerMap`: A map of registered managers.
- **Key Methods**:
  - `registerManager(name, manager)`: Adds functionality.
  - `start()`: Starts the render loop.
  - `requestAnimationFrame(fn)`: Adds custom frame logic.

### 3.2. Managers (`src/manager/`)

Managers handle specific subsystems. All managers must extend the `Manager` base class (`src/manager/base.ts`).

- **Base Class**: `Manager`
- **Lifecycle**:
  - `install(viz)`: Called when registered.
  - `update(delta, time)`: Called every frame.
  - `setSize(width, height)`: Called on resize.
  - `dispose()`: Cleanup.
- **Built-in Managers**:
  - `InteractionManager`: Handles mouse events/raycasting.
  - `AssetManager`: Loads textures, models, JSON.
  - `GuiManager`: Wraps Tweakpane for debug UI.
  - `CacheManager`: Caches assets.
  - `ComponentManager`: Manages a collection of Components.

### 3.3. Components (`src/components/`, `src/manager/component.ts`)

Components are high-level wrappers around `THREE.Object3D`. They usually correspond to a specific visual element (e.g., a 3D Map, a Flying Line).

- **Base Class**: `Component<Options>`
- **Key Properties**:
  - `object3D`: The underlying THREE object (usually a Group).
  - `options`: Configuration passed during init.
- **Lifecycle**:
  - `create()`: Initialize the 3D objects.
  - `render()`: (Optional) specific render logic.
  - `update(delta, time)`: Animation loop logic.
  - `dispose()`: Cleanup resources (geometries, materials).
- **Extension**: New visual elements should extend `Component`.

## 4. Coding Standards & Patterns

### 4.1. TypeScript

- Use strict typing. Avoid `any` unless absolutely necessary.
- Use `interface` for Options objects.
- Use the `KeyOf<T>`, `Nullable<T>` utils from `@/types/utils`.

### 4.2. Path Aliases

- Use `@/` to import from `src/`.
  - Example: `import { EventDispatcher } from '@/helpers';`

### 4.3. Event Handling

- The `Viz` class and `Component` class extend `EventDispatcher`.
- Use `this.emit('event', payload)` and `this.on('event', callback)`.

### 4.4. Creating a New Component

1. Create a directory in `src/components/<name>/`.
2. Create `index.ts` exporting the component class, use `export class` instead of `export default`.
3. custom component should extend `Component<Options>`.
4. Implement `create()` to build the `this.object3D`.
5. Implement `update()` for animations.
6. Export in `src/components/index.ts`.

Example:

```typescript
import * as THREE from 'three';
import {Component} from '@/manager/component';

interface MyCompOptions {color: string}

export class MyComp extends Component<MyCompOptions> {
  readonly name = 'MyComp';

  create() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshBasicMaterial({color: this.options.color});
    this.object3D.add(new THREE.Mesh(geo, mat));
  }
}
```

### 4.5. Assets

- Use `viz.assetManager` to load assets.
- `staticPath` in `Viz` options prefixes URLs.

### 4.6. Code Style Guidelines

The project uses `@antfu/eslint-config` with specific customizations. AI agents should ensure generated code follows these patterns:

- **Semicolons**: Always use semicolons (`semi: true`).
- **Object Spacing**: Do NOT use spaces inside curly braces (e.g., `{key: 'value'}`, NOT `{ key: 'value' }`).
- **Block Spacing**: Do NOT use spaces inside blocks.
- **Console**: `console.log` is allowed.
- **Return Types**: Explicit return types for functions are not strictly required.
- **Brace Style**: Use 1tbs (One True Brace Style).

When in doubt, run `pnpm lint:fix` to format the code.

## 5. Development Workflow

### Playground

The `playground/` folder is used for testing and examples.

- **Run**: `pnpm dev` (starts the playground).
- **Edit**: Modify `playground/index.ts` or add scenes in `playground/scene/` to test changes.

### Building

- **Build**: `pnpm build` (uses unbuild).
- **Lint**: `pnpm lint`.

## 6. Common Tasks for Agents

- **Add a new visual effect**: Create a new component in `src/components/`, creating shaders in `src/materials/` if needed.
- **Fix a bug**: Check the relevant Manager or Component.
- **Update dependencies**: Check `package.json` and ensure compatibility with Three.js versions.
- **Improve Types**: Check `src/types/`.

By following these guidelines, you ensure consistency and maintainability across the `viz.js` framework.
