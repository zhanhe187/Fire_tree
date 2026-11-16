export interface WorldPoint {
  x: number;
  y: number;
  z: number;
}

export interface GraphRotation {
  yaw: number;
  pitch: number;
}

export interface ProjectedPoint extends WorldPoint {
  depth: number;
  scale: number;
}

export interface EdgeLabelProjection {
  x: number;
  y: number;
  angle: number;
  opacity: number;
}

export function expandedWorldPosition(index: number, total: number): WorldPoint;

export function projectPoint(
  point: WorldPoint,
  rotation: GraphRotation,
  options?: { centerX?: number; centerY?: number; perspective?: number },
): ProjectedPoint;

export function projectEdgeLabel(source: ProjectedPoint, target: ProjectedPoint): EdgeLabelProjection;

export function applyProjectedDrag(
  worldPoint: WorldPoint,
  delta: { x: number; y: number },
  projectedScale?: number,
): WorldPoint;
