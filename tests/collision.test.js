import test from 'node:test';
import assert from 'node:assert/strict';
import { floorHeightAt, resolveMovement, stairHeightAt } from '../src/collision.js';

const wall = { minX: 1, maxX: 1.2, minZ: 0, maxZ: 3, minY: 0, maxY: 3.6 };
const stair = {
  id: 'grand-stair',
  width: 4,
  length: 8,
  lower: { x: 5, z: 0, y: 0 },
  upper: { x: 5, z: 8, y: 4.5 }
};
const layout = {
  levels: {
    ground: {
      elevation: 0,
      walkableAreas: [
        { minX: 0, maxX: 3, minZ: 0, maxZ: 10 },
        { minX: 7, maxX: 10, minZ: 0, maxZ: 10 }
      ]
    },
    cinema: {
      elevation: 4.5,
      walkableAreas: [{ minX: 0, maxX: 10, minZ: 0, maxZ: 10 }]
    }
  },
  stairs: [stair]
};

test('movement stops at a wall before the robot radius overlaps it', () => {
  const result = resolveMovement({ x: 0, y: 0, z: 1 }, { x: 2, z: 0 }, 0.275, 0.8, [wall]);
  assert.ok(result.x <= 0.725);
});

test('movement slides along a wall and passes through a doorway gap', () => {
  const slid = resolveMovement({ x: 0.7, y: 0, z: -1 }, { x: 0, z: 3 }, 0.275, 0.8, [wall]);
  assert.ok(slid.z > 0);
  const doorwayWalls = [
    { ...wall, minZ: 0, maxZ: 1 },
    { ...wall, minZ: 2, maxZ: 3 }
  ];
  const throughDoor = resolveMovement({ x: 0, y: 0, z: 1.5 }, { x: 2, z: 0 }, 0.275, 0.8, doorwayWalls);
  assert.ok(throughDoor.x > 1.5);
});

test('seat-bank bounds block movement', () => {
  const seatBank = { minX: 1, maxX: 2, minZ: 0, maxZ: 2, minY: 0, maxY: 1 };
  const result = resolveMovement({ x: 0, y: 0, z: 1 }, { x: 2, z: 0 }, 0.275, 0.8, [seatBank]);
  assert.ok(result.x <= 0.725);
});

test('colliders on a different floor do not block movement', () => {
  const upperWall = { ...wall, minY: 4.5, maxY: 8.1 };
  const result = resolveMovement({ x: 0, y: 0, z: 1 }, { x: 2, z: 0 }, 0.275, 0.8, [upperWall]);
  assert.equal(result.x, 2);
});

test('floor selection follows current elevation and walkable areas', () => {
  assert.equal(floorHeightAt(2, 2, layout, 0), 0);
  assert.equal(floorHeightAt(2, 2, layout, 4.5), 4.5);
  assert.equal(floorHeightAt(20, 20, layout, 0), null);
});

test('stair ramp height interpolates between landings and respects its width', () => {
  assert.equal(stairHeightAt(5, 0, stair, 0.275), 0);
  assert.equal(stairHeightAt(5, 4, stair, 0.275), 2.25);
  assert.equal(stairHeightAt(5, 8, stair, 0.275), 4.5);
  assert.equal(stairHeightAt(8, 4, stair, 0.275), null);
  assert.equal(floorHeightAt(5, 4, layout, 2.25), 2.25);
});

test('ramp elevations cannot be reached from the side or by walking beneath the upper landing', () => {
  assert.equal(floorHeightAt(5, 4, layout, 0), null);
  assert.equal(floorHeightAt(5, 8, layout, 0), null);
  assert.equal(floorHeightAt(5, 0.1, layout, 0), 0.05625);
  assert.equal(floorHeightAt(8, 4, layout, 0), 0);
});
