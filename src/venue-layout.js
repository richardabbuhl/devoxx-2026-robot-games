const WORLD_BOUNDS = Object.freeze({ minX: 0, maxX: 64, minZ: 0, maxZ: 46 });
const LEVELS = Object.freeze({
  ground: Object.freeze({
    id: 'ground',
    elevation: 0,
    bounds: WORLD_BOUNDS,
    walkableAreas: Object.freeze([
      Object.freeze({ minX: 0, maxX: 33, minZ: 0, maxZ: 46 }),
      Object.freeze({ minX: 37, maxX: 42, minZ: 0, maxZ: 46 }),
      Object.freeze({ minX: 33, maxX: 37, minZ: 0, maxZ: 22 }),
      Object.freeze({ minX: 33, maxX: 37, minZ: 30.5, maxZ: 46 }),
      Object.freeze({ minX: 42, maxX: 64, minZ: 14, maxZ: 32 }),
      Object.freeze({ minX: 44, maxX: 63, minZ: 1, maxZ: 12 }),
      Object.freeze({ minX: 44, maxX: 63, minZ: 12, maxZ: 14 }),
      Object.freeze({ minX: 49, maxX: 62, minZ: 32, maxZ: 44 })
    ])
  }),
  cinema: Object.freeze({
    id: 'cinema',
    elevation: 4.5,
    bounds: WORLD_BOUNDS,
    walkableAreas: Object.freeze([
      Object.freeze({ minX: 0, maxX: 64, minZ: 0, maxZ: 13 }),
      Object.freeze({ minX: 0, maxX: 64, minZ: 13, maxZ: 20 }),
      Object.freeze({ minX: 0, maxX: 29, minZ: 20, maxZ: 33 }),
      Object.freeze({ minX: 41, maxX: 64, minZ: 20, maxZ: 33 }),
      Object.freeze({ minX: 0, maxX: 64, minZ: 33, maxZ: 46 }),
      Object.freeze({ minX: 29, maxX: 33, minZ: 20, maxZ: 33 }),
      Object.freeze({ minX: 37, maxX: 41, minZ: 20, maxZ: 33 }),
      Object.freeze({ minX: 33, maxX: 37, minZ: 20, maxZ: 22 }),
      Object.freeze({ minX: 33, maxX: 37, minZ: 30.5, maxZ: 33 })
    ])
  })
});

function room(id, name, level, x, z, width, depth, type, openings = [], extra = {}) {
  return Object.freeze({
    id,
    name,
    level,
    type,
    x,
    z,
    width,
    depth,
    openings: Object.freeze(openings.map((opening) => Object.freeze(opening))),
    ...extra
  });
}

const rooms = [
  room('exhibition-hall', 'Exhibition Hall', 'ground', 0, 0, 42, 46, 'exhibition', [
    { side: 'south', offset: 18, width: 6, id: 'main-entrance' },
    { side: 'east', offset: 19, width: 4, id: 'exhibition-concourse-door' }
  ]),
  room('ground-concourse', 'Ground Floor Concourse', 'ground', 42, 14, 22, 18, 'foyer', [
    { side: 'west', offset: 6, width: 6, id: 'hall-connection' },
    { side: 'south', offset: 9, width: 3, id: 'bof-connection' },
    { side: 'north', offset: 11, width: 3, id: 'reception-connection' },
    { side: 'east', offset: 7, width: 3, id: 'side-entrance' }
  ]),
  room('bof-connector', 'BOF Connector', 'ground', 44, 12, 19, 2, 'corridor', [], { wallsEnabled: false }),
  room('reception', 'Reception', 'ground', 49, 32, 13, 12, 'reception', [
    { side: 'south', offset: 4, width: 3, id: 'reception-door' }
  ]),
  room('bof-rooms', 'BOF Rooms', 'ground', 44, 1, 19, 11, 'meeting', [
    { side: 'north', offset: 7, width: 3, id: 'bof-door' }
  ]),
  room('foyer', 'Cinema Foyer', 'cinema', 29, 20, 12, 13, 'foyer', [
    { side: 'south', offset: 3, width: 6, id: 'foyer-concourse-door' }
  ]),
  room('cinema-concourse', 'Auditorium Concourse', 'cinema', 0, 13, 64, 7, 'corridor', [], { wallsEnabled: false }),
  room('west-auditorium-corridor', 'West Auditorium Corridor', 'cinema', 0, 20, 29, 13, 'corridor', [], { wallsEnabled: false }),
  room('east-auditorium-corridor', 'East Auditorium Corridor', 'cinema', 41, 20, 23, 13, 'corridor', [], { wallsEnabled: false }),
  room('grand-stair-well', 'Grand Stair', 'cinema', 33, 20, 4, 13, 'stairwell', [], { wallsEnabled: false })
];

const upperAuditoriums = [
  { number: 1, x: 0, width: 12, facing: 'north' },
  { number: 2, x: 13, width: 8, facing: 'north' },
  { number: 3, x: 22, width: 7, facing: 'north' },
  { number: 4, x: 42, width: 7, facing: 'north' },
  { number: 5, x: 50, width: 7, facing: 'north' },
  { number: 6, x: 58, width: 6, facing: 'north' }
];
const lowerAuditoriums = Array.from({ length: 8 }, (_, index) => ({
  number: index + 7,
  x: index * 8,
  width: 8,
  facing: 'south'
}));

for (const auditorium of upperAuditoriums) {
  const id = `aud-${String(auditorium.number).padStart(2, '0')}`;
  const auditoriumRoom = room(id, `Auditorium ${String(auditorium.number).padStart(2, '0')}`, 'cinema', auditorium.x, 33, auditorium.width, 13, 'auditorium', [
    { side: 'south', offset: Math.max(0.5, (auditorium.width - 2) / 2), width: 2, id: `${id}-entry` }
  ], { number: auditorium.number, facing: auditorium.facing, screen: auditorium.facing });
  rooms.push(auditoriumRoom);
}

for (const auditorium of lowerAuditoriums) {
  const id = `aud-${String(auditorium.number).padStart(2, '0')}`;
  rooms.push(room(id, `Auditorium ${String(auditorium.number).padStart(2, '0')}`, 'cinema', auditorium.x, 0, auditorium.width, 13, 'auditorium', [
    { side: 'north', offset: 3, width: 2, id: `${id}-entry` }
  ], { number: auditorium.number, facing: auditorium.facing, screen: auditorium.facing }));
}

const doors = [];
const walls = [];
const WALL_THICKNESS = 0.25;
const WALL_HEIGHT = 3.6;

function addWall(roomData, side, start, end, elevation) {
  if (end - start <= 0.05) return;
  const bounds = side === 'north' || side === 'south'
    ? {
        minX: start,
        maxX: end,
        minZ: side === 'north' ? roomData.z + roomData.depth - WALL_THICKNESS / 2 : roomData.z - WALL_THICKNESS / 2,
        maxZ: side === 'north' ? roomData.z + roomData.depth + WALL_THICKNESS / 2 : roomData.z + WALL_THICKNESS / 2
      }
    : {
        minX: side === 'east' ? roomData.x + roomData.width - WALL_THICKNESS / 2 : roomData.x - WALL_THICKNESS / 2,
        maxX: side === 'east' ? roomData.x + roomData.width + WALL_THICKNESS / 2 : roomData.x + WALL_THICKNESS / 2,
        minZ: start,
        maxZ: end
      };
  walls.push(Object.freeze({
    id: `${roomData.id}-${side}-${walls.length}`,
    roomId: roomData.id,
    level: roomData.level,
    side,
    minY: elevation,
    maxY: elevation + WALL_HEIGHT,
    ...bounds
  }));
}

for (const roomData of rooms) {
  if (roomData.wallsEnabled === false) continue;
  const elevation = LEVELS[roomData.level].elevation;
  const sides = {
    south: { from: roomData.x, to: roomData.x + roomData.width },
    north: { from: roomData.x, to: roomData.x + roomData.width },
    west: { from: roomData.z, to: roomData.z + roomData.depth },
    east: { from: roomData.z, to: roomData.z + roomData.depth }
  };
  for (const [side, { from, to }] of Object.entries(sides)) {
    const sideOpenings = roomData.openings
      .filter((opening) => opening.side === side)
      .map((opening) => ({ start: from + opening.offset, end: from + opening.offset + opening.width, ...opening }))
      .sort((first, second) => first.start - second.start);
    let cursor = from;
    for (const opening of sideOpenings) {
      const openingStart = Math.max(from, Math.min(to, opening.start));
      const openingEnd = Math.max(openingStart, Math.min(to, opening.end));
      addWall(roomData, side, cursor, openingStart, elevation);
      if (openingEnd > openingStart) {
        const center = (openingStart + openingEnd) / 2;
        doors.push(Object.freeze({
          id: opening.id,
          roomId: roomData.id,
          level: roomData.level,
          side,
          width: openingEnd - openingStart,
          position: side === 'north' || side === 'south'
            ? { x: center, y: elevation, z: side === 'north' ? roomData.z + roomData.depth : roomData.z }
            : { x: side === 'east' ? roomData.x + roomData.width : roomData.x, y: elevation, z: center }
        }));
      }
      cursor = Math.max(cursor, openingEnd);
    }
    addWall(roomData, side, cursor, to, elevation);
  }
}

const seating = rooms
  .filter(({ type }) => type === 'auditorium')
  .flatMap((auditorium) => {
    const aisle = 1.1;
    const sideAisle = 0.65;
    const insetZ = 1.25;
    const crossAisleWidth = 1.1;
    const seatingMinZ = auditorium.z + insetZ;
    const seatingMaxZ = auditorium.z + auditorium.depth - insetZ;
    const crossAisleCenter = auditorium.z + auditorium.depth / 2;
    const seatSections = [
      { section: 'front', minZ: seatingMinZ, maxZ: crossAisleCenter - crossAisleWidth / 2 },
      { section: 'rear', minZ: crossAisleCenter + crossAisleWidth / 2, maxZ: seatingMaxZ }
    ];
    const centerX = auditorium.x + auditorium.width / 2;
    return ['left', 'right'].flatMap((bank) => seatSections.map((section) => {
      const minX = bank === 'left' ? auditorium.x + sideAisle : centerX + aisle / 2;
      const maxX = bank === 'left' ? centerX - aisle / 2 : auditorium.x + auditorium.width - sideAisle;
      const sectionDepth = section.maxZ - section.minZ;
      return Object.freeze({
        id: `${auditorium.id}-seats-${bank}-${section.section}`,
        roomId: auditorium.id,
        level: auditorium.level,
        facing: auditorium.facing,
        bank,
        section: section.section,
        rows: Math.max(2, Math.floor(sectionDepth / 0.9)),
        bounds: Object.freeze({ minX, maxX, minZ: section.minZ, maxZ: section.maxZ })
      });
    }));
  });

const stairs = [Object.freeze({
  id: 'grand-stair',
  width: 4,
  lower: Object.freeze({ x: 35, z: 22, y: 0, roomId: 'exhibition-hall' }),
  upper: Object.freeze({ x: 35, z: 30.5, y: 4.5, roomId: 'foyer' }),
  length: 8.5
})];

const entrances = [
  Object.freeze({ id: 'main-entrance', roomId: 'exhibition-hall', level: 'ground', position: Object.freeze({ x: 21, y: 0, z: 0 }), width: 6 }),
  Object.freeze({ id: 'side-entrance', roomId: 'ground-concourse', level: 'ground', position: Object.freeze({ x: 64, y: 0, z: 22.5 }), width: 3 })
];

const objectives = [
  Object.freeze({ id: 'beacon', robotId: 'voxxy', roomId: 'exhibition-hall', level: 'ground', position: Object.freeze({ x: 18, y: 0, z: 25 }) }),
  Object.freeze({ id: 'power', robotId: 'droid', roomId: 'aud-03', level: 'cinema', position: Object.freeze({ x: 25, y: 4.5, z: 34.5 }), requiredActivations: 3 }),
  Object.freeze({ id: 'gate', robotId: 'biggy', roomId: 'exhibition-hall', level: 'ground', position: Object.freeze({ x: 35, y: 0, z: 22 }), minimumSpeed: 0.7 })
];

const rawLayout = {
  units: 'metres',
  assumptions: Object.freeze({ worldScale: 1, floorSeparation: 4.5, typicalClearHeight: 3.6, stairWidth: 4, note: 'Plan proportions are traced approximately; dimensions are modeling estimates, not a venue survey.' }),
  levels: LEVELS,
  bounds: WORLD_BOUNDS,
  rooms: Object.freeze(rooms),
  walls: Object.freeze(walls),
  doors: Object.freeze(doors),
  seating: Object.freeze(seating),
  stairs: Object.freeze(stairs),
  entrances: Object.freeze(entrances),
  objectives: Object.freeze(objectives)
};

export const venueLayout = Object.freeze(rawLayout);
