import { floorHeightAt, resolveMovement } from './collision.js';

export const ROBOT_SPECS = Object.freeze({
  voxxy: Object.freeze({ id: 'voxxy', name: 'Voxxy', speed: 3, objectiveId: 'beacon', message: 'Scan the beacon in the Exhibition Hall.', color: '#70c8bd' }),
  droid: Object.freeze({ id: 'droid', name: 'Droid', speed: 1.8, objectiveId: 'power', message: 'Repair the projector by Auditorium 03.', color: '#82a9d5' }),
  biggy: Object.freeze({ id: 'biggy', name: 'Biggy', speed: 1.24, objectiveId: 'gate', message: 'Charge the grand stair gate.', color: '#e8784d' })
});

const ACCELERATION = 8;
const DECELERATION = 10;
const COLLIDER_RADIUS = 0.275;
const COLLIDER_HEIGHT = 0.8;

function approach(current, target, distance) {
  if (current < target) return Math.min(current + distance, target);
  return Math.max(current - distance, target);
}

export function advanceRobotState(state, input, deltaSeconds, layout, colliders) {
  const deltaTime = Math.max(0, Math.min(deltaSeconds, 0.1));
  const magnitude = Math.hypot(input.x ?? 0, input.z ?? 0);
  const inputScale = magnitude > 1 ? 1 / magnitude : 1;
  const inputX = (input.x ?? 0) * inputScale;
  const inputZ = (input.z ?? 0) * inputScale;
  const acceleration = inputX !== 0 || inputZ !== 0 ? ACCELERATION : DECELERATION;
  const velocity = {
    x: approach(state.vx, inputX * state.speed, acceleration * deltaTime),
    z: approach(state.vz, inputZ * state.speed, acceleration * deltaTime)
  };
  const delta = { x: velocity.x * deltaTime, z: velocity.z * deltaTime };
  let position = resolveMovement(state, delta, COLLIDER_RADIUS, COLLIDER_HEIGHT, colliders);
  const elevation = floorHeightAt(position.x, position.z, layout, state.y);
  if (elevation === null) {
    position = { x: state.x, z: state.z };
    velocity.x = 0;
    velocity.z = 0;
    return { ...state, ...position, vx: velocity.x, vz: velocity.z };
  }
  if (position.x === state.x && delta.x !== 0) velocity.x = 0;
  if (position.z === state.z && delta.z !== 0) velocity.z = 0;
  return { ...state, ...position, y: elevation, vx: velocity.x, vz: velocity.z };
}

function movementInputValue(keys) {
  return {
    x: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')),
    z: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
  };
}

export function createRobotController({ THREE, camera, canvas, layout, colliders, spawnPoints }) {
  const robots = Object.fromEntries(Object.values(ROBOT_SPECS).map((spec) => {
    const spawn = spawnPoints[spec.id];
    return [spec.id, {
      ...spec,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      spawn: { x: spawn.x, y: spawn.y, z: spawn.z },
      vx: 0,
      vz: 0,
      radius: COLLIDER_RADIUS,
      height: COLLIDER_HEIGHT,
      mesh: spawn.mesh
    }];
  }));
  const keys = new Set();
  let selectedRobotId = 'voxxy';

  function selectRobot(id) {
    if (!robots[id]) return false;
    selectedRobotId = id;
    keys.clear();
    return true;
  }

  function setInput(key, pressed) {
    const normalizedKey = key.toLowerCase();
    if (pressed) keys.add(normalizedKey);
    else keys.delete(normalizedKey);
    return movementInputValue(keys);
  }

  function update(deltaSeconds) {
    const robot = robots[selectedRobotId];
    const robotInput = movementInputValue(keys);
    const next = advanceRobotState(robot, robotInput, deltaSeconds, layout, colliders);
    Object.assign(robot, next);
    if (robot.mesh) {
      robot.mesh.position.set(robot.x, robot.y + robot.height / 2, robot.z);
      if (Math.hypot(robot.vx, robot.vz) > 0.01) robot.mesh.rotation.y = Math.atan2(robot.vx, robot.vz);
    }
    if (camera && THREE) {
      const target = new THREE.Vector3(robot.x, robot.y + 0.55, robot.z);
      const desiredPosition = new THREE.Vector3(robot.x + 5.6, robot.y + 6, robot.z + 8.5);
      camera.position.lerp(desiredPosition, 1 - Math.exp(-4 * Math.min(deltaSeconds, 0.1)));
      camera.lookAt(target);
    }
    return robot;
  }

  if (canvas) canvas.tabIndex = canvas.tabIndex < 0 ? 0 : canvas.tabIndex;

  return {
    robots,
    selectRobot,
    setInput,
    update,
    get activeRobotId() { return selectedRobotId; }
  };
}
