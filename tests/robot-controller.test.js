import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceRobotState, cameraFollowConfiguration, createRobotController, ROBOT_SPECS, screenRelativeMovementInput } from '../src/robot-controller.js';
import { venueLayout } from '../src/venue-layout.js';

test('robot specialists retain distinct speeds', () => {
  assert.ok(ROBOT_SPECS.voxxy.speed > ROBOT_SPECS.droid.speed);
  assert.ok(ROBOT_SPECS.droid.speed > ROBOT_SPECS.biggy.speed);
});

test('diagonal movement is normalized to robot speed', () => {
  const state = { x: 8, y: 0, z: 25, vx: 0, vz: 0, speed: 3 };
  const next = advanceRobotState(state, { x: 1, z: 1 }, 1, venueLayout, []);
  assert.ok(Math.hypot(next.vx, next.vz) <= state.speed + 1e-9);
});

test('movement accelerates and releases with smooth deceleration', () => {
  const state = { x: 8, y: 0, z: 25, vx: 0, vz: 0, speed: 3 };
  const moving = advanceRobotState(state, { x: 0, z: 1 }, 0.08, venueLayout, []);
  assert.ok(moving.vz > 0 && moving.vz < state.speed);
  const coasting = advanceRobotState(moving, { x: 0, z: 0 }, 0.08, venueLayout, []);
  assert.ok(coasting.vz >= 0 && coasting.vz < moving.vz);
});

test('wall collision is applied to movement state', () => {
  const wall = { minX: 1, maxX: 1.2, minZ: 24, maxZ: 26, minY: 0, maxY: 3.6 };
  const state = { x: 0, y: 0, z: 25, vx: 0, vz: 0, speed: 3 };
  const next = advanceRobotState(state, { x: 1, z: 0 }, 1, venueLayout, [wall]);
  assert.ok(next.x <= 0.725);
});

test('robots climb and descend the grand stair without changing X/Z by teleportation', () => {
  const stair = venueLayout.stairs[0];
  const ascending = advanceRobotState({ x: stair.lower.x, y: stair.lower.y, z: stair.lower.z, vx: 0, vz: 0, speed: 3 }, { x: 0, z: 1 }, 1, venueLayout, []);
  assert.ok(ascending.z > stair.lower.z);
  assert.ok(ascending.y > stair.lower.y && ascending.y < stair.upper.y);
  const descending = advanceRobotState({ x: stair.upper.x, y: stair.upper.y, z: stair.upper.z, vx: 0, vz: 0, speed: 3 }, { x: 0, z: -1 }, 1, venueLayout, []);
  assert.ok(descending.z < stair.upper.z);
  assert.ok(descending.y < stair.upper.y && descending.y > stair.lower.y);
});

test('camera rises above the stairwell to preserve a clear descent view', () => {
  const stair = venueLayout.stairs[0];
  const robot = {
    x: stair.lower.x,
    y: stair.lower.y,
    z: (stair.lower.z + stair.upper.z) / 2,
    radius: 0.275
  };
  const camera = cameraFollowConfiguration(robot, venueLayout);
  assert.ok(camera.position.y - robot.y >= 12);
  assert.ok(Math.abs(camera.position.z - robot.z) >= 6.5);
  assert.ok(camera.target.y > robot.y);
});

test('portrait camera moves closer while preserving an elevated view', () => {
  const robot = { x: 8, y: 4.5, z: 25, radius: 0.275 };
  const landscape = cameraFollowConfiguration(robot, venueLayout);
  const portrait = cameraFollowConfiguration(robot, venueLayout, { portrait: true });
  const distanceFromRobot = ({ position }) => Math.hypot(
    position.x - robot.x,
    position.y - robot.y,
    position.z - robot.z
  );
  assert.ok(distanceFromRobot(portrait) < distanceFromRobot(landscape));
  assert.ok(portrait.position.y > portrait.target.y);
});

test('portrait camera views the lower stair from the unobstructed approach side', () => {
  const stair = venueLayout.stairs[0];
  const robot = { x: stair.lower.x, y: stair.lower.y, z: stair.lower.z, radius: 0.275 };
  const camera = cameraFollowConfiguration(robot, venueLayout, { portrait: true });
  assert.ok(camera.position.z < robot.z);
  assert.ok(camera.position.y > robot.y);
});

test('portrait camera keeps Biggy visible from the approach side at the gate marker', () => {
  const gate = venueLayout.objectives.find(({ id }) => id === 'gate');
  const robot = { ...gate.position, objectiveId: gate.id, radius: 0.275 };
  const camera = cameraFollowConfiguration(robot, venueLayout, { portrait: true });
  assert.ok(camera.position.z < robot.z);
});

test('touch directions follow the portrait camera after the stair approach view switches', () => {
  const gate = venueLayout.objectives.find(({ id }) => id === 'gate');
  const robot = { ...gate.position, objectiveId: gate.id, radius: 0.275 };
  const camera = cameraFollowConfiguration(robot, venueLayout, { portrait: true });
  assert.deepEqual(screenRelativeMovementInput({ x: 1, z: -1 }, camera), { x: -1, z: 1 });
});

test('held touch direction stays stable while crossing Biggy camera switch boundary', () => {
  const gate = venueLayout.objectives.find(({ id }) => id === 'gate');
  const spawnPoints = Object.fromEntries(Object.values(ROBOT_SPECS).map(({ id }) => [
    id,
    { ...venueLayout.objectives.find(({ robotId }) => robotId === id).position }
  ]));
  spawnPoints.biggy = { x: gate.position.x + 3.1, y: 0, z: gate.position.z };
  const controller = createRobotController({
    THREE: null,
    camera: null,
    canvas: { clientWidth: 390, clientHeight: 844, tabIndex: 0 },
    layout: venueLayout,
    colliders: [],
    spawnPoints
  });
  controller.selectRobot('biggy');
  controller.setTouchInput('d', true);
  controller.robots.biggy.x = gate.position.x + 2.9;
  const startX = controller.robots.biggy.x;
  controller.update(0.08);
  assert.ok(controller.robots.biggy.x > startX);
});

test('keyboard input moves the selected robot and selection switches specialists', () => {
  const spawnPoints = Object.fromEntries(Object.values(ROBOT_SPECS).map(({ id }) => [
    id,
    { ...venueLayout.objectives.find(({ robotId }) => robotId === id).position }
  ]));
  const voxxyMesh = { position: { set() {} }, rotation: { y: null } };
  const biggyMesh = { position: { set() {} }, rotation: { y: null } };
  spawnPoints.voxxy = { x: 8, y: 0, z: 25, mesh: voxxyMesh };
  spawnPoints.biggy = { x: 27, y: 0, z: 25, mesh: biggyMesh };
  const controller = createRobotController({
    THREE: null,
    camera: null,
    canvas: null,
    layout: venueLayout,
    colliders: [],
    spawnPoints
  });
  assert.ok(Math.abs(voxxyMesh.rotation.y + Math.PI / 2) < 1e-9);
  assert.equal(biggyMesh.rotation.y, voxxyMesh.rotation.y);
  const startZ = controller.robots.voxxy.z;
  controller.setInput('W', true);
  controller.update(0.08);
  assert.ok(controller.robots.voxxy.z < startZ);
  assert.ok(Math.abs(voxxyMesh.rotation.y) < 1e-9);
  assert.equal(controller.selectRobot('droid'), true);
  assert.equal(controller.activeRobotId, 'droid');
});
