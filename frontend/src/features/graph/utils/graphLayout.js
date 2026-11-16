const DEFAULT_CENTER = { x: 420, y: 260 };
const DEFAULT_PERSPECTIVE = 720;

export function expandedWorldPosition(index, total) {
  const count = Math.max(total, 1);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const normalized = count === 1 ? 0 : index / (count - 1);
  const radialBand = 72 + (index % 5) * 31 + normalized * 150;
  const angle = index * goldenAngle - Math.PI / 2;
  const layer = (index % 7) - 3;
  const wave = Math.sin(index * 1.37) * 58;

  return {
    x: Math.cos(angle) * radialBand,
    y: Math.sin(angle) * radialBand * 0.58 + Math.cos(index * 0.71) * 32,
    z: layer * 48 + wave,
  };
}

export function projectPoint(point, rotation, options = {}) {
  const centerX = options.centerX ?? DEFAULT_CENTER.x;
  const centerY = options.centerY ?? DEFAULT_CENTER.y;
  const perspective = options.perspective ?? DEFAULT_PERSPECTIVE;
  const yaw = rotation.yaw ?? 0;
  const pitch = ((rotation.pitch ?? 0) * Math.PI) / 180;

  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  const yawX = point.x * cosYaw + point.z * sinYaw;
  const yawZ = -point.x * sinYaw + point.z * cosYaw;
  const pitchY = point.y * cosPitch - yawZ * sinPitch;
  const pitchZ = point.y * sinPitch + yawZ * cosPitch;
  const scale = clamp(perspective / (perspective - pitchZ), 0.62, 1.42);

  return {
    x: centerX + yawX * scale,
    y: centerY + pitchY * scale,
    z: pitchZ,
    depth: clamp(0.72 + ((pitchZ + 260) / 520) * 0.48, 0.62, 1.28),
    scale,
  };
}

export function projectEdgeLabel(source, target) {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = clamp((Math.atan2(dy, dx) * 180) / Math.PI, -42, 42);
  const depth = (source.depth + target.depth) / 2;

  return {
    x: midX,
    y: midY - 8,
    angle,
    opacity: clamp(0.62 + depth * 0.22, 0.62, 0.95),
  };
}

export function applyProjectedDrag(worldPoint, delta, projectedScale = 1) {
  const safeScale = Math.max(projectedScale, 0.2);
  return {
    x: worldPoint.x + delta.x / safeScale,
    y: worldPoint.y + delta.y / safeScale,
    z: worldPoint.z,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
