import { floorHeightAt, resolveMovement, stairHeightAt } from './collision.js';

export const ROBOT_SPECS = Object.freeze({
  voxxy: Object.freeze({ id: 'voxxy', name: 'Voxxy', speed: 3, objectiveId: 'beacon', message: 'Take Voxxy to the beacon in the Exhibition Hall, then press Activate.', color: '#70c8bd' }),
  droid: Object.freeze({ id: 'droid', name: 'Droid', speed: 1.8, objectiveId: 'power', message: 'Take Droid up the middle stairs to Auditorium 03. Fix the projector by pressing Activate 3 times.', color: '#82a9d5' }),
  biggy: Object.freeze({ id: 'biggy', name: 'Biggy', speed: 1.24, objectiveId: 'gate', message: 'Take Biggy to the stair gate. Keep rolling, then press Activate.', color: '#e8784d' })
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

export function cameraFollowConfiguration(robot, layout, { portrait = false } = {}) {
  const activeStair = (layout.stairs ?? []).find((stair) => (
    stairHeightAt(robot.x, robot.z, stair, robot.radius ?? 0) !== null
  ));
  if (activeStair) {
    const stairProgress = (robot.y - activeStair.lower.y) / (activeStair.upper.y - activeStair.lower.y);
    const cameraZOffset = stairProgress < 0.35 ? -7 : 7;
    return {
      target: { x: robot.x, y: robot.y + 0.4, z: robot.z },
      position: portrait
        ? { x: robot.x + 5, y: robot.y + 9, z: robot.z + cameraZOffset }
        : { x: robot.x + 7, y: robot.y + 12, z: robot.z + cameraZOffset }
    };
  }
  const isUpperLevel = robot.y >= 4.5;
  const objective = (layout.objectives ?? []).find(({ id }) => id === robot.objectiveId);
  const isNearLowerGate = objective?.id === 'gate'
    && Math.hypot(robot.x - objective.position.x, robot.z - objective.position.z) <= 3;
  return {
    target: { x: robot.x, y: robot.y + 0.55, z: robot.z },
    position: portrait
      ? { x: robot.x + 3.7, y: robot.y + (isUpperLevel ? 4.2 : 2.8), z: robot.z + (isNearLowerGate ? -5.6 : 5.6) }
      : { x: robot.x + 5.6, y: robot.y + (isUpperLevel ? 6 : 3.2), z: robot.z + 8.5 }
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
  for (const robot of Object.values(robots)) {
    const objective = layout.objectives?.find(({ id }) => id === robot.objectiveId);
    if (!robot.mesh || !objective) continue;
    const targetX = objective.position.x - robot.x;
    const targetZ = objective.position.z - robot.z;
    if (Math.hypot(targetX, targetZ) > 0.01) robot.mesh.rotation.y = Math.atan2(-targetX, -targetZ);
  }
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
      if (Math.hypot(robot.vx, robot.vz) > 0.01) robot.mesh.rotation.y = Math.atan2(-robot.vx, -robot.vz);
    }
    if (camera && THREE) {
      const portrait = canvas && canvas.clientHeight > canvas.clientWidth;
      const cameraConfig = cameraFollowConfiguration(robot, layout, { portrait });
      const target = new THREE.Vector3(cameraConfig.target.x, cameraConfig.target.y, cameraConfig.target.z);
      const desiredPosition = new THREE.Vector3(cameraConfig.position.x, cameraConfig.position.y, cameraConfig.position.z);
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
