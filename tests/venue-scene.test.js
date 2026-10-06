import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { venueLayout } from '../src/venue-layout.js';
import { createVenueScene } from '../src/venue-scene.js';

test('venue scene is assembled from both levels and shared layout colliders', () => {
  const result = createVenueScene(THREE, venueLayout);
  assert.ok(result.scene.isScene);
  assert.ok(result.scene.children.length > 0);
  assert.ok(result.bounds.maxX > result.bounds.minX);
  assert.ok(result.colliders.some((collider) => collider.level === 'ground'));
  assert.ok(result.colliders.some((collider) => collider.level === 'cinema'));
  assert.equal(result.objectiveMarkers.size, venueLayout.objectives.length);
  assert.equal(result.spawnPoints.voxxy.y, venueLayout.levels.ground.elevation);
  assert.equal(result.spawnPoints.droid.y, venueLayout.levels.cinema.elevation);
  assert.ok(result.scene.getObjectByName('grand-stair-treads'));
  assert.ok(result.scene.getObjectByName('aud-03-carpet'));
  assert.ok(result.scene.getObjectByName('power-navigation-beam'));
  for (const pathId of ['beacon', 'power', 'gate']) {
    assert.ok(result.scene.getObjectByName(`${pathId}-approach-path`));
  }
  assert.equal(result.scene.getObjectByName('beacon-approach-path').visible, true);
  assert.equal(result.scene.getObjectByName('power-approach-path').visible, false);
  const navigationChevron = result.scene.getObjectByName('beacon-approach-path').children[0].children[0];
  assert.equal(navigationChevron.material.color.getHex(), 0x63d889);
  result.setSelectedRobot('droid');
  assert.equal(result.scene.getObjectByName('beacon-approach-path').visible, false);
  assert.equal(result.scene.getObjectByName('power-approach-path').visible, true);
  const voxxyShield = result.scene.getObjectByName('voxxy-face-screen');
  assert.equal(voxxyShield.material.color.getHex(), 0x030506);
  assert.ok(voxxyShield.position.z < -0.25);
  assert.equal(result.scene.getObjectByName('voxxy-eye-glow').intensity, 0.8);
  assert.ok(result.scene.getObjectByName('droid-repair-visor'));
  assert.ok(result.scene.getObjectByName('biggy-blue-helmet'));
  assert.ok(result.scene.getObjectByName('grand-stair-route-lock'));
  assert.ok(result.colliders.some(({ id }) => id === 'grand-stair-route-lock'));
  assert.equal(result.systemEffects.size, venueLayout.objectives.length);
  result.setCompletedObjectives(['beacon', 'power']);
  assert.equal(result.scene.getObjectByName('beacon-approach-path').visible, false);
  assert.equal(result.scene.getObjectByName('power-approach-path').visible, false);
  result.setSelectedRobot('voxxy');
  assert.equal(result.scene.getObjectByName('beacon-approach-path').visible, false);
  assert.equal(result.systemEffects.get('beacon').visible, true);
  assert.equal(result.systemEffects.get('power').visible, true);
  assert.equal(result.systemEffects.get('gate').visible, false);
  result.setCompletedObjectives(['gate']);
  assert.equal(result.scene.getObjectByName('grand-stair-route-lock').visible, false);
  assert.equal(result.colliders.some(({ id }) => id === 'grand-stair-route-lock'), false);
});

test('scene collider bounds match layout walls and seating banks', () => {
  const result = createVenueScene(THREE, venueLayout);
  const wallIds = new Set(result.colliders.filter(({ kind }) => kind === 'wall').map(({ id }) => id));
  const seatIds = new Set(result.colliders.filter(({ kind }) => kind === 'seating').map(({ id }) => id));
  for (const wall of venueLayout.walls) assert.ok(wallIds.has(wall.id));
  for (const seats of venueLayout.seating) assert.ok(seatIds.has(seats.id));
});
