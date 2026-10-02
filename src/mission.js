function asRobotList(robots) {
  return Array.isArray(robots) ? robots : Object.values(robots);
}

function snapshot(state) {
  return Object.freeze({
    ...state,
    completedObjectiveIds: Object.freeze([...state.completedObjectiveIds]),
    interactionProgress: Object.freeze({ ...state.interactionProgress })
  });
}

export function createMission({ robots, objectives, durationSeconds }) {
  const robotList = asRobotList(robots);
  const robotById = new Map(robotList.map((robot) => [robot.id, robot]));
  const objectiveById = new Map(objectives.map((objective) => [objective.id, objective]));
  const listeners = new Set();
  const initialDuration = durationSeconds;
  let state = {
    active: false,
    failed: false,
    freeRoam: false,
    selectedRobotId: robotList[0]?.id ?? null,
    secondsLeft: initialDuration,
    completedObjectiveIds: [],
    interactionProgress: {},
    message: 'Select a crew member, then move them to their marked console.'
  };

  function publish() {
    const current = snapshot(state);
    for (const listener of listeners) listener(current);
    return current;
  }

  function start() {
    if (state.failed || state.freeRoam) return false;
    state.active = true;
    state.message = 'Mission active';
    publish();
    return true;
  }

  function selectRobot(id) {
    if (!robotById.has(id)) return false;
    state.selectedRobotId = id;
    const robot = robotById.get(id);
    const objective = objectiveById.get(robot.objectiveId);
    state.message = state.completedObjectiveIds.includes(robot.objectiveId)
      ? `${robot.name} is online. Choose another specialist.`
      : robot.message ?? `Move ${robot.name} to ${objective?.id ?? 'their objective'}.`;
    publish();
    return true;
  }

  function activate(position, { speed = 0 } = {}) {
    if (!state.active) return false;
    const robot = robotById.get(state.selectedRobotId);
    const objectiveId = robot?.objectiveId;
    const objective = objectiveById.get(objectiveId);
    if (!robot || !objective || state.completedObjectiveIds.includes(objectiveId)) return false;
    const distance = Math.hypot(
      position.x - objective.position.x,
      position.y - objective.position.y,
      position.z - objective.position.z
    );
    if (distance > (objective.interactionRadius ?? 1.8)) {
      state.message = `Too far away. Move closer to ${objective.id}.`;
      publish();
      return false;
    }
    const minimumSpeed = objective.minimumSpeed ?? 0;
    if (speed < minimumSpeed) {
      state.message = `${robot.name} must keep moving and press E at ${objective.id}.`;
      publish();
      return false;
    }
    const requiredActivations = objective.requiredActivations ?? 1;
    const activations = (state.interactionProgress[objectiveId] ?? 0) + 1;
    if (activations < requiredActivations) {
      state.interactionProgress[objectiveId] = activations;
      state.message = `${robot.name} is repairing ${objective.id}: ${activations} / ${requiredActivations}.`;
      publish();
      return true;
    }
    state.completedObjectiveIds.push(objectiveId);
    delete state.interactionProgress[objectiveId];
    state.message = `${robot.name} completed ${objective.id}.`;
    if (state.completedObjectiveIds.length === objectiveById.size) {
      state.active = false;
      state.freeRoam = true;
      state.message = 'All systems online. Free exploration unlocked.';
    } else {
      const nextRobot = robotList.find(({ objectiveId: nextObjective }) => !state.completedObjectiveIds.includes(nextObjective));
      if (nextRobot) {
        state.selectedRobotId = nextRobot.id;
        const nextObjective = objectiveById.get(nextRobot.objectiveId);
        state.message = nextRobot.message ?? `Move ${nextRobot.name} to ${nextObjective?.id ?? 'their objective'}.`;
      }
    }
    publish();
    return true;
  }

  function tick(deltaSeconds) {
    if (!state.active) return snapshot(state);
    const previousDisplayedSecond = Math.ceil(state.secondsLeft);
    state.secondsLeft = Math.max(0, state.secondsLeft - Math.max(0, deltaSeconds));
    if (state.secondsLeft === 0) {
      state.active = false;
      state.failed = true;
      state.message = 'The doors opened. Shift failed.';
      return publish();
    }
    return Math.ceil(state.secondsLeft) !== previousDisplayedSecond ? publish() : snapshot(state);
  }

  function restart() {
    for (const robot of robotList) {
      if (robot.spawn) Object.assign(robot, robot.spawn);
      robot.vx = 0;
      robot.vz = 0;
      if (robot.mesh) robot.mesh.position.set(robot.x, robot.y + (robot.height ?? 0.8) / 2, robot.z);
    }
    state = {
      active: false,
      failed: false,
      freeRoam: false,
      selectedRobotId: robotList[0]?.id ?? null,
      secondsLeft: initialDuration,
      completedObjectiveIds: [],
      interactionProgress: {},
      message: 'Select a crew member, then move them to their marked console.'
    };
    publish();
    return snapshot(state);
  }

  return {
    get state() { return snapshot(state); },
    start,
    selectRobot,
    activate,
    tick,
    restart,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot(state));
      return () => listeners.delete(listener);
    }
  };
}
