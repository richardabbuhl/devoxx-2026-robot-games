import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission } from '../src/mission.js';

function createFixture(durationSeconds = 10) {
  const robots = [
    { id: 'voxxy', name: 'Voxxy', objectiveId: 'beacon', spawn: { x: 1, y: 0, z: 0 }, x: 1, y: 0, z: 0 },
    { id: 'droid', name: 'Droid', message: 'Repair the projector by Auditorium 03.', objectiveId: 'power', spawn: { x: 4, y: 4.5, z: 0 }, x: 4, y: 4.5, z: 0 },
    { id: 'biggy', name: 'Biggy', objectiveId: 'gate', spawn: { x: 8, y: 0, z: 0 }, x: 8, y: 0, z: 0 }
  ];
  const objectives = [
    { id: 'beacon', position: { x: 1, y: 0, z: 0 }, interactionRadius: 2 },
    { id: 'power', position: { x: 4, y: 4.5, z: 0 }, interactionRadius: 2, requiredActivations: 3 },
    { id: 'gate', position: { x: 8, y: 0, z: 0 }, interactionRadius: 2, minimumSpeed: 0.7 }
  ];
  return { robots, mission: createMission({ robots, objectives, durationSeconds }) };
}

test('mission starts inactive and begins counting only after start', () => {
  const { mission } = createFixture();
  assert.equal(mission.state.active, false);
  mission.start();
  mission.tick(1);
  assert.equal(mission.state.active, true);
  assert.equal(mission.state.secondsLeft, 9);
});

test('specialist activation completes only a nearby assigned objective', () => {
  const { mission } = createFixture();
  mission.start();
  assert.equal(mission.activate({ x: 5, y: 0, z: 0 }), false);
  assert.equal(mission.state.completedObjectiveIds.length, 0);
  assert.equal(mission.activate({ x: 1.5, y: 0, z: 0 }), true);
  assert.deepEqual(mission.state.completedObjectiveIds, ['beacon']);
  assert.deepEqual(mission.state.completionOrder, ['beacon']);
  assert.equal(mission.state.sequenceScore, 20);
  assert.equal(mission.state.selectedRobotId, 'voxxy');
  assert.match(mission.state.message, /Link Droid next/);
  assert.equal(mission.activate({ x: 1.5, y: 0, z: 0 }), false);
});

test('timer failure stops mission and movement eligibility', () => {
  const { mission } = createFixture(1);
  mission.start();
  mission.tick(1);
  assert.equal(mission.state.active, false);
  assert.equal(mission.state.failed, true);
  assert.equal(mission.state.freeRoam, false);
});

test('objectives apply their specialist interaction rules before completing', () => {
  const { mission } = createFixture(20);
  mission.start();
  mission.selectRobot('biggy');
  mission.activate({ x: 8, y: 0, z: 0 }, { speed: 0.8 });
  mission.selectRobot('voxxy');
  mission.activate({ x: 1, y: 0, z: 0 });
  assert.equal(mission.state.sequenceScore, 60);
  mission.selectRobot('droid');
  mission.activate({ x: 4, y: 4.5, z: 0 });
  mission.activate({ x: 4, y: 4.5, z: 0 });
  assert.deepEqual(mission.state.interactionProgress, { power: 2 });
  assert.equal(mission.state.completedObjectiveIds.length, 2);
  mission.activate({ x: 4, y: 4.5, z: 0 });
  assert.equal(mission.state.active, false);
  assert.equal(mission.state.freeRoam, true);
  assert.equal(mission.state.completedObjectiveIds.length, 3);
  assert.equal(mission.state.sequenceScore, 100);
  mission.tick(5);
  assert.equal(mission.state.secondsLeft, 20);
});

test('restart clears progress and restores all robot spawns', () => {
  const { robots, mission } = createFixture();
  mission.start();
  mission.activate({ x: 1, y: 0, z: 0 });
  robots[0].x = 9;
  mission.restart();
  assert.equal(mission.state.active, false);
  assert.equal(mission.state.failed, false);
  assert.equal(mission.state.freeRoam, false);
  assert.equal(mission.state.secondsLeft, 10);
  assert.deepEqual(mission.state.completedObjectiveIds, []);
  assert.equal(mission.state.sequenceScore, 0);
  assert.equal(robots[0].x, 1);
  assert.equal(mission.state.selectedRobotId, 'voxxy');
});
