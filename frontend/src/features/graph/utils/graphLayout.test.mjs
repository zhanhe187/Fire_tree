import assert from 'node:assert/strict';
import test from 'node:test';
import {
  expandedWorldPosition,
  projectEdgeLabel,
  projectPoint,
} from './graphLayout.js';

test('expandedWorldPosition distributes nodes across z-depth layers', () => {
  const nodes = Array.from({ length: 18 }, (_, index) => expandedWorldPosition(index, 18));
  const distinctDepths = new Set(nodes.map((node) => Math.round(node.z / 20)));

  assert.ok(distinctDepths.size >= 5);
  assert.ok(nodes.some((node) => node.z > 0));
  assert.ok(nodes.some((node) => node.z < 0));
});

test('projectPoint changes screen position and depth when yaw rotates', () => {
  const point = { x: 180, y: 20, z: 120 };
  const front = projectPoint(point, { yaw: 0, pitch: 18 });
  const rotated = projectPoint(point, { yaw: 0.75, pitch: 18 });

  assert.notEqual(Math.round(front.x), Math.round(rotated.x));
  assert.notEqual(Math.round(front.depth * 100), Math.round(rotated.depth * 100));
});

test('projectEdgeLabel returns readable finite label coordinates', () => {
  const source = projectPoint({ x: -120, y: -30, z: 80 }, { yaw: 0.45, pitch: 22 });
  const target = projectPoint({ x: 110, y: 45, z: -60 }, { yaw: 0.45, pitch: 22 });
  const label = projectEdgeLabel(source, target);

  assert.ok(Number.isFinite(label.x));
  assert.ok(Number.isFinite(label.y));
  assert.ok(Number.isFinite(label.angle));
  assert.ok(label.opacity >= 0.62);
});
