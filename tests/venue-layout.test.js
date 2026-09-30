import test from 'node:test';
import assert from 'node:assert/strict';
import { venueLayout } from '../src/venue-layout.js';

test('venue levels use the assumed shared elevations', () => {
  assert.equal(venueLayout.units, 'metres');
  assert.equal(venueLayout.levels.ground.elevation, 0);
  assert.equal(venueLayout.levels.cinema.elevation, 4.5);
});

test('grand stair lands from the exhibition hall in the first-floor foyer', () => {
  const stair = venueLayout.stairs.find(({ id }) => id === 'grand-stair');
  assert.ok(stair);
  assert.equal(stair.lower.roomId, 'exhibition-hall');
  assert.equal(stair.upper.roomId, 'foyer');
  assert.equal(stair.lower.y, venueLayout.levels.ground.elevation);
  assert.equal(stair.upper.y, venueLayout.levels.cinema.elevation);
  assert.equal(stair.width, 4);
  assert.equal(stair.length, 8.5);
  assert.equal(venueLayout.objectives.find(({ id }) => id === 'gate').level, 'ground');
});

test('reception and BOF routes meet the ground-floor public concourse', () => {
  const receptionDoor = venueLayout.doors.find(({ id }) => id === 'reception-connection');
  const receptionRoomDoor = venueLayout.doors.find(({ id }) => id === 'reception-door');
  const bofConnectionDoor = venueLayout.doors.find(({ id }) => id === 'bof-connection');
  const bofRoomDoor = venueLayout.doors.find(({ id }) => id === 'bof-door');
  assert.ok(receptionDoor);
  assert.ok(receptionRoomDoor);
  assert.ok(bofConnectionDoor);
  assert.ok(bofRoomDoor);
  assert.equal(receptionDoor.position.x, receptionRoomDoor.position.x);
  assert.equal(receptionDoor.position.z, receptionRoomDoor.position.z);
  assert.equal(bofConnectionDoor.position.x, bofRoomDoor.position.x);
  assert.equal(bofConnectionDoor.position.z, 14);
  assert.equal(bofRoomDoor.position.z, 12);
  assert.ok(venueLayout.levels.ground.walkableAreas.some((area) => area.minX <= 50 && area.maxX >= 50 && area.minZ <= 13 && area.maxZ >= 13));
});

test('side entrance marker aligns with an opening on the concourse exterior wall', () => {
  const entrance = venueLayout.entrances.find(({ id }) => id === 'side-entrance');
  const door = venueLayout.doors.find(({ id }) => id === 'side-entrance');
  assert.ok(entrance);
  assert.ok(door);
  assert.equal(door.roomId, entrance.roomId);
  assert.equal(door.position.x, entrance.position.x);
  assert.equal(door.position.z, entrance.position.z);
});

test('rooms and objectives reference known levels and rooms', () => {
  const roomIds = new Set(venueLayout.rooms.map(({ id }) => id));
  assert.ok(roomIds.has('exhibition-hall'));
  assert.ok(roomIds.has('foyer'));
  for (const room of venueLayout.rooms) assert.ok(venueLayout.levels[room.level], room.id);
  for (const objective of venueLayout.objectives) {
    assert.ok(roomIds.has(objective.roomId), objective.id);
    assert.ok(venueLayout.levels[objective.level], objective.id);
  }
});

test('each level declares walkable regions instead of treating the shared envelope as floor', () => {
  assert.ok(venueLayout.levels.ground.walkableAreas.length > 0);
  assert.ok(venueLayout.levels.cinema.walkableAreas.length > 0);
  assert.equal(venueLayout.levels.ground.walkableAreas.some((area) => area.minX <= 43 && area.maxX >= 43 && area.minZ <= 13 && area.maxZ >= 13), false);
  assert.equal(venueLayout.levels.cinema.walkableAreas.some((area) => area.minX <= 43 && area.maxX >= 43 && area.minZ <= 13 && area.maxZ >= 13), true);
});

test('first-floor slab leaves the stairwell open between its landings', () => {
  const stair = venueLayout.stairs.find(({ id }) => id === 'grand-stair');
  const shaftX = stair.lower.x;
  const shaftZ = (stair.lower.z + stair.upper.z) / 2;
  const overShaft = venueLayout.levels.cinema.walkableAreas.some((area) => (
    shaftX >= area.minX && shaftX <= area.maxX && shaftZ >= area.minZ && shaftZ <= area.maxZ
  ));
  assert.equal(overShaft, false);
  assert.ok(venueLayout.levels.cinema.walkableAreas.some((area) => area.minX <= stair.upper.x && area.maxX >= stair.upper.x && area.minZ <= stair.upper.z && area.maxZ >= stair.upper.z));
});

test('ground floor excludes the stair shaft but keeps its lower landing connected', () => {
  const stair = venueLayout.stairs.find(({ id }) => id === 'grand-stair');
  const inShaft = venueLayout.levels.ground.walkableAreas.some((area) => (
    stair.lower.x >= area.minX && stair.lower.x <= area.maxX
    && 26 >= area.minZ && 26 <= area.maxZ
  ));
  const lowerLandingConnected = venueLayout.levels.ground.walkableAreas.some((area) => (
    stair.lower.x >= area.minX && stair.lower.x <= area.maxX
    && stair.lower.z >= area.minZ && stair.lower.z <= area.maxZ
  ));
  assert.equal(inShaft, false);
  assert.equal(lowerLandingConnected, true);
});

test('auditoriums preserve the numbered cinema sequence and seat banks', () => {
  const auditoriums = venueLayout.rooms.filter(({ type }) => type === 'auditorium');
  assert.ok(auditoriums.length >= 6);
  assert.deepEqual(auditoriums.map(({ number }) => number), [...auditoriums.map(({ number }) => number)].sort((a, b) => a - b));
  assert.ok(venueLayout.seating.length >= auditoriums.length);
  for (const seatBank of venueLayout.seating) assert.ok(auditoriums.some(({ id }) => id === seatBank.roomId));
});

test('auditorium seating banks leave a cross-aisle and center aisle open', () => {
  for (const auditorium of venueLayout.rooms.filter(({ type }) => type === 'auditorium')) {
    const banks = venueLayout.seating.filter(({ roomId }) => roomId === auditorium.id);
    assert.equal(banks.length, 4, auditorium.id);
    for (const side of ['left', 'right']) {
      const sections = banks.filter(({ bank }) => bank === side).sort((a, b) => a.bounds.minZ - b.bounds.minZ);
      assert.equal(sections.length, 2, auditorium.id);
      assert.ok(sections[1].bounds.minZ - sections[0].bounds.maxZ >= 1.1 - 1e-9, auditorium.id);
    }
    const centerX = auditorium.x + auditorium.width / 2;
    assert.ok(banks.some(({ bounds }) => bounds.maxX < centerX));
    assert.ok(banks.some(({ bounds }) => bounds.minX > centerX));
  }
});

test('collision walls have positive bounds and omit door openings as gaps', () => {
  assert.ok(venueLayout.walls.length > 0);
  for (const wall of venueLayout.walls) {
    assert.ok(wall.maxX > wall.minX, wall.id);
    assert.ok(wall.maxZ > wall.minZ, wall.id);
    assert.ok(wall.maxY > wall.minY, wall.id);
  }
  assert.ok(venueLayout.doors.length > 0);
  for (const door of venueLayout.doors) {
    const wallSegments = venueLayout.walls.filter((wall) => wall.roomId === door.roomId && wall.side === door.side);
    const openingCenter = door.side === 'north' || door.side === 'south' ? door.position.x : door.position.z;
    const spansDoorCenter = wallSegments.some((wall) => {
      const start = door.side === 'north' || door.side === 'south' ? wall.minX : wall.minZ;
      const end = door.side === 'north' || door.side === 'south' ? wall.maxX : wall.maxZ;
      return start <= openingCenter && openingCenter <= end;
    });
    assert.equal(spansDoorCenter, false, door.id);
  }
});

test('layout data is immutable at the exported boundary', () => {
  assert.ok(Object.isFrozen(venueLayout));
  assert.ok(Object.isFrozen(venueLayout.levels));
});
