/// <reference types="vite/client" />

declare module 'three' {
  export class WebGLRenderer {
    capabilities: { isWebGL2: boolean };
    domElement: HTMLCanvasElement;
    outputColorSpace: string;
    constructor(options?: Record<string, unknown>);
    setClearColor(color: number, alpha?: number): void;
    setPixelRatio(pixelRatio: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    render(scene: Scene, camera: OrthographicCamera | PerspectiveCamera): void;
    dispose(): void;
  }

  export class Scene {
    background: Color | null;
    fog: Fog | null;
    add(object: unknown): void;
    clear(): void;
    traverse(callback: (object: Object3D) => void): void;
  }

  export class Object3D {
    matrixWorld: Matrix4;
    updateMatrixWorld(force?: boolean): void;
    traverse(callback: (object: Object3D) => void): void;
  }

  export class OrthographicCamera {
    position: { z: number };
    constructor(left: number, right: number, top: number, bottom: number, near: number, far: number);
  }

  export class PerspectiveCamera {
    aspect: number;
    fov: number;
    position: Vector3;
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    lookAt(vector: Vector3): void;
    updateProjectionMatrix(): void;
  }

  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
    lerp(vector: Vector2, alpha: number): this;
  }

  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    clone(): Vector3;
    set(x: number, y: number, z: number): this;
    setX(x: number): this;
    multiply(vector: Vector3): this;
    add(vector: Vector3): this;
    applyMatrix4(matrix: Matrix4): this;
    fromBufferAttribute(attribute: BufferAttribute, index: number): this;
  }

  export class Vector4 {
    x: number;
    y: number;
    z: number;
    w: number;
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
  }

  export class Color {
    r: number;
    g: number;
    b: number;
    constructor(color?: string | number | Color);
    set(color: string | number): this;
  }

  export class ShaderMaterial {
    uniforms: Record<string, { value: unknown }>;
    onBeforeCompile?: (shader: { vertexShader: string; fragmentShader: string }) => void;
    constructor(parameters?: Record<string, unknown>);
    dispose(): void;
  }

  export class BufferAttribute {
    count: number;
    constructor(array: Float32Array, itemSize: number);
  }

  export class BufferGeometry {
    attributes: Record<string, BufferAttribute>;
    index: unknown;
    setAttribute(name: string, attribute: BufferAttribute): this;
    setIndex(index: unknown): this;
    computeBoundingSphere(): void;
    dispose(): void;
  }

  export class InstancedBufferAttribute extends BufferAttribute {
    constructor(array: Float32Array, itemSize: number, normalized?: boolean);
  }

  export class InstancedBufferGeometry extends BufferGeometry {
    instanceCount: number;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
  }

  export class TubeGeometry extends BufferGeometry {
    constructor(path: LineCurve3, tubularSegments?: number, radius?: number, radialSegments?: number, closed?: boolean);
  }

  export class LineCurve3 {
    constructor(v1: Vector3, v2: Vector3);
  }

  export class Mesh<
    TGeometry extends BufferGeometry = BufferGeometry,
    TMaterial extends ShaderMaterial | ShaderMaterial[] = ShaderMaterial,
  > extends Object3D {
    isMesh: boolean;
    geometry: TGeometry;
    material: TMaterial;
    position: Vector3;
    rotation: Vector3;
    frustumCulled: boolean;
    constructor(geometry: TGeometry, material: TMaterial);
  }

  export class Points extends Object3D {
    geometry: BufferGeometry;
    position: Vector3;
    rotation: Vector3;
    constructor(geometry: BufferGeometry, material: ShaderMaterial);
  }

  export class Box3 {
    constructor();
    setFromPoints(points: Vector3[]): this;
    getCenter(target: Vector3): Vector3;
    getSize(target: Vector3): Vector3;
  }

  export class Matrix4 {}

  export class Clock {
    elapsedTime: number;
    constructor(autoStart?: boolean);
    start(): void;
    getDelta(): number;
    getElapsedTime(): number;
  }

  export class Fog {
    color: Color;
    near: number;
    far: number;
    constructor(color: number, near?: number, far?: number);
  }

  export class LoadingManager {
    constructor(onLoad?: () => void);
    itemStart(url: string): void;
    itemEnd(url: string): void;
  }

  export const MathUtils: {
    lerp(start: number, end: number, alpha: number): number;
  };

  export const ShaderChunk: Record<string, string>;
  export const DoubleSide: number;
  export const AdditiveBlending: number;
  export const SRGBColorSpace: string;
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import type { Object3D } from 'three';

  export interface GLTF {
    scene: Object3D;
  }

  export class GLTFLoader {
    loadAsync(url: string): Promise<GLTF>;
  }
}
