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
});

test('scene collider bounds match layout walls and seating banks', () => {
  const result = createVenueScene(THREE, venueLayout);
  const wallIds = new Set(result.colliders.filter(({ kind }) => kind === 'wall').map(({ id }) => id));
  const seatIds = new Set(result.colliders.filter(({ kind }) => kind === 'seating').map(({ id }) => id));
  for (const wall of venueLayout.walls) assert.ok(wallIds.has(wall.id));
  for (const seats of venueLayout.seating) assert.ok(seatIds.has(seats.id));
});
