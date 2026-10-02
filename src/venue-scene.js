const COLORS = Object.freeze({
  background: 0x101719,
  publicFloor: 0x827b6c,
  cinemaFloor: 0x343536,
  wall: 0xc5c1b7,
  auditoriumWall: 0x252a2b,
  ceiling: 0x8a867d,
  carpet: 0x292526,
  seat: 0x7a2933,
  stair: 0xb5aa96,
  rail: 0x343b3b,
  amber: 0xe1a65a,
  cyan: 0x6bd0c3,
  blue: 0x80a8d8,
  orange: 0xe9784f,
  voxxyOrange: 0xf07822,
  droidMetal: 0x2b3035,
  biggyBlue: 0x35434d,
  biggyRust: 0xaf4e2e,
  face: 0x111518,
  ivory: 0xd7d3c8
});

const ROBOT_COLORS = Object.freeze({ voxxy: COLORS.cyan, droid: COLORS.blue, biggy: COLORS.orange });
const OBJECTIVE_COLORS = Object.freeze({ beacon: COLORS.cyan, power: COLORS.blue, gate: COLORS.orange });
const FLOOR_THICKNESS = 0.18;
const ROBOT_HEIGHT = 0.8;

function material(THREE, color, options = {}) {
  const parameters = {
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0.04,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  };
  if (options.depthWrite !== undefined) parameters.depthWrite = options.depthWrite;
  return new THREE.MeshStandardMaterial(parameters);
}

function makeBox(THREE, parent, name, bounds, meshMaterial, options = {}) {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const height = bounds.maxY - bounds.minY;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), meshMaterial);
  mesh.name = name;
  mesh.position.set((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, (bounds.minZ + bounds.maxZ) / 2);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function makePlane(THREE, parent, name, bounds, elevation, planeMaterial) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(bounds.maxX - bounds.minX, FLOOR_THICKNESS, bounds.maxZ - bounds.minZ),
    planeMaterial
  );
  mesh.name = name;
  mesh.position.set((bounds.minX + bounds.maxX) / 2, elevation - FLOOR_THICKNESS / 2, (bounds.minZ + bounds.maxZ) / 2);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/*
  const metalMaterial = material(THREE, COLORS.rail, { metalness: 0.72, roughness: 0.26 });
  const darkMaterial = material(THREE, COLORS.face, { metalness: 0.2, roughness: 0.42 });
  const ivoryMaterial = material(THREE, COLORS.ivory, { metalness: 0.48, roughness: 0.32 });
  const addPart = (name, geometry, meshMaterial, position, rotation = [0, 0, 0]) => {
  const rotation = door.side === 'east' || door.side === 'west' ? Math.PI / 2 : 0;
  const width = door.width;
  const center = door.position;
    part.rotation.set(...rotation);
  const y = center.y;
  const zDepth = 0.32;
  const group = new THREE.Group();
  group.name = `${door.id}-frame`;
  group.position.set(center.x, y, center.z);
  group.rotation.y = rotation;
  const jambHeight = 2.2;
    const orange = material(THREE, COLORS.voxxyOrange, { metalness: 0.32, roughness: 0.22 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 2.8, roughness: 0.2 });
    const head = addPart('head', new THREE.SphereGeometry(0.32, 20, 14), orange, [0, 0.2, 0]);
    head.scale.set(1.12, 0.88, 1);
    const face = addPart('face-screen', new THREE.SphereGeometry(0.245, 20, 12), darkMaterial, [0, 0.19, -0.2]);
    face.scale.set(1.12, 0.7, 0.24);
    for (const side of [-1, 1]) {
      addPart(`ear-${side}`, new THREE.SphereGeometry(0.1, 12, 10), orange, [side * 0.22, 0.42, 0]);
      addPart(`arm-${side}`, new THREE.CapsuleGeometry(0.065, 0.2, 4, 8), orange, [side * 0.28, -0.16, -0.01], [0, 0, side * 0.35]);
    }
    addPart('torso', new THREE.ConeGeometry(0.19, 0.38, 16), orange, [0, -0.2, 0]);
    addPart('left-eye', new THREE.SphereGeometry(0.035, 10, 8), eyeMaterial, [-0.085, 0.2, -0.255]);
    addPart('right-eye', new THREE.SphereGeometry(0.035, 10, 8), eyeMaterial, [0.085, 0.2, -0.255]);
    jamb.position.set(side * (width / 2 - jambWidth / 2), jambHeight / 2, 0);
    const droidPaint = material(THREE, COLORS.droidMetal, { metalness: 0.52, roughness: 0.54 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 2.1, roughness: 0.2 });
    const torso = addPart('repair-torso', new THREE.BoxGeometry(0.42, 0.38, 0.25), droidPaint, [0, -0.03, 0]);
    torso.rotation.x = -0.12;
    const head = addPart('repair-head', new THREE.SphereGeometry(0.19, 16, 12), droidPaint, [0, 0.34, -0.015]);
    head.scale.set(0.92, 1.05, 0.88);
    addPart('repair-visor', new THREE.BoxGeometry(0.22, 0.08, 0.025), darkMaterial, [0, 0.34, -0.17]);
    addPart('left-eye', new THREE.SphereGeometry(0.025, 10, 8), eyeMaterial, [-0.06, 0.35, -0.19]);
    addPart('right-eye', new THREE.SphereGeometry(0.025, 10, 8), eyeMaterial, [0.06, 0.35, -0.19]);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(width, jambWidth, zDepth), frameMaterial);
      addPart(`shoulder-${side}`, new THREE.SphereGeometry(0.09, 12, 10), metalMaterial, [side * 0.26, 0.08, 0]);
      addPart(`repair-arm-${side}`, new THREE.CapsuleGeometry(0.04, 0.26, 4, 8), droidPaint, [side * 0.29, -0.16, 0], [0, 0, side * 0.12]);
      addPart(`repair-leg-${side}`, new THREE.CapsuleGeometry(0.05, 0.2, 4, 8), droidPaint, [side * 0.12, -0.39, 0]);
      addPart(`foot-${side}`, new THREE.BoxGeometry(0.11, 0.06, 0.16), metalMaterial, [side * 0.12, -0.54, -0.025]);
  scene.add(group);
}
    const bluePaint = material(THREE, COLORS.biggyBlue, { metalness: 0.45, roughness: 0.5 });
    const rustPaint = material(THREE, COLORS.biggyRust, { metalness: 0.36, roughness: 0.58 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.ivory, emissive: COLORS.ivory, emissiveIntensity: 1.6, roughness: 0.22 });
    const belly = addPart('armored-belly', new THREE.SphereGeometry(0.34, 18, 14), rustPaint, [0, -0.02, -0.015]);
    belly.scale.set(1.08, 1.02, 0.95);
    const helmet = addPart('blue-helmet', new THREE.SphereGeometry(0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), bluePaint, [0, 0.23, 0]);
    helmet.scale.set(1.05, 0.82, 1);
    for (const side of [-1, 1]) {
      addPart(`eye-${side}`, new THREE.SphereGeometry(0.045, 10, 8), eyeMaterial, [side * 0.12, 0.26, -0.29]);
      addPart(`arm-${side}`, new THREE.CapsuleGeometry(0.08, 0.2, 4, 8), bluePaint, [side * 0.36, -0.12, 0], [0, 0, side * 0.12]);
      addPart(`leg-${side}`, new THREE.CylinderGeometry(0.09, 0.11, 0.16, 12), metalMaterial, [side * 0.14, -0.39, 0]);
      addPart(`foot-${side}`, new THREE.SphereGeometry(0.1, 12, 8), darkMaterial, [side * 0.14, -0.5, -0.04]);
  const opening = roomData.openings[0];
    addPart('antenna', new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), metalMaterial, [0, 0.57, 0]);
  if (!opening) return;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#151b1e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#e1a65a';
  context.lineWidth = 5;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  context.fillStyle = '#e9e6dc';
  context.font = '600 28px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(`AUDITORIUM ${String(roomData.number).padStart(2, '0')}`, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sign.name = `${roomData.id}-sign`;
  sign.position.set(roomData.x + opening.offset + opening.width / 2, level.elevation + 1.9, roomData.z - 0.2);
  sign.scale.set(2.5, 0.94, 1);
  sign.renderOrder = 2;
  scene.add(sign);
}
*/

function addDoorFrame(THREE, scene, door, frameMaterial) {
  const rotation = door.side === 'east' || door.side === 'west' ? Math.PI / 2 : 0;
  const group = new THREE.Group();
  group.name = `${door.id}-frame`;
  group.position.set(door.position.x, door.position.y, door.position.z);
  group.rotation.y = rotation;
  const jambHeight = 2.2;
  const jambWidth = 0.16;
  const jambGeometry = new THREE.BoxGeometry(jambWidth, jambHeight, 0.32);
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(jambGeometry, frameMaterial);
    jamb.position.set(side * (door.width / 2 - jambWidth / 2), jambHeight / 2, 0);
    jamb.castShadow = true;
    group.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(door.width, jambWidth, 0.32), frameMaterial);
  lintel.position.set(0, jambHeight - jambWidth / 2, 0);
  group.add(lintel);
  scene.add(group);
}

function addAuditoriumSign(THREE, scene, roomData, level) {
  if (typeof document === 'undefined') return;
  const opening = roomData.openings[0];
  if (!opening) return;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#151b1e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#e1a65a';
  context.lineWidth = 5;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  context.fillStyle = '#e9e6dc';
  context.font = '600 28px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(`AUDITORIUM ${String(roomData.number).padStart(2, '0')}`, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sign.name = `${roomData.id}-sign`;
  sign.position.set(roomData.x + opening.offset + opening.width / 2, level.elevation + 1.9, roomData.z - 0.2);
  sign.scale.set(2.5, 0.94, 1);
  sign.renderOrder = 2;
  scene.add(sign);
}

function createRobotMesh(THREE, id) {
  const robot = new THREE.Group();
  robot.name = `${id}-robot`;
  const metal = material(THREE, COLORS.rail, { metalness: 0.72, roughness: 0.26 });
  const dark = material(THREE, COLORS.face, { metalness: 0.2, roughness: 0.42 });
  const addPart = (name, geometry, meshMaterial, position, rotation = [0, 0, 0]) => {
    const part = new THREE.Mesh(geometry, meshMaterial);
    part.name = `${id}-${name}`;
    part.position.set(...position);
    part.rotation.set(...rotation);
    part.castShadow = true;
    part.receiveShadow = true;
    robot.add(part);
    return part;
  };

  if (id === 'voxxy') {
    const orange = material(THREE, COLORS.voxxyOrange, { metalness: 0.32, roughness: 0.22 });
    const faceShield = material(THREE, 0x030506, { metalness: 0.58, roughness: 0.14 });
    const eye = new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 5.5, roughness: 0.16 });
    const head = addPart('head', new THREE.SphereGeometry(0.32, 20, 14), orange, [0, 0.2, 0]);
    head.scale.set(1.12, 0.88, 1);
    const face = addPart('face-screen', new THREE.SphereGeometry(0.265, 20, 12), faceShield, [0, 0.19, -0.3]);
    face.scale.set(1.1, 0.68, 0.22);
    for (const side of [-1, 1]) {
      addPart(`ear-${side}`, new THREE.SphereGeometry(0.1, 12, 10), orange, [side * 0.22, 0.42, 0]);
      addPart(`arm-${side}`, new THREE.CapsuleGeometry(0.065, 0.2, 4, 8), orange, [side * 0.28, -0.16, -0.01], [0, 0, side * 0.35]);
    }
    addPart('torso', new THREE.ConeGeometry(0.19, 0.38, 16), orange, [0, -0.2, 0]);
    addPart('left-eye', new THREE.SphereGeometry(0.045, 10, 8), eye, [-0.09, 0.2, -0.37]);
    addPart('right-eye', new THREE.SphereGeometry(0.045, 10, 8), eye, [0.09, 0.2, -0.37]);
    const eyeGlow = new THREE.PointLight(COLORS.amber, 0.8, 1.2, 2);
    eyeGlow.name = 'voxxy-eye-glow';
    eyeGlow.position.set(0, 0.2, -0.4);
    robot.add(eyeGlow);
  } else if (id === 'droid') {
    const paint = material(THREE, COLORS.droidMetal, { metalness: 0.52, roughness: 0.54 });
    const eye = new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 2.1, roughness: 0.2 });
    addPart('repair-torso', new THREE.BoxGeometry(0.42, 0.38, 0.25), paint, [0, -0.03, 0], [-0.12, 0, 0]);
    const head = addPart('repair-head', new THREE.SphereGeometry(0.19, 16, 12), paint, [0, 0.34, -0.015]);
    head.scale.set(0.92, 1.05, 0.88);
    addPart('repair-visor', new THREE.BoxGeometry(0.22, 0.08, 0.025), dark, [0, 0.34, -0.17]);
    for (const side of [-1, 1]) {
      addPart(`eye-${side}`, new THREE.SphereGeometry(0.025, 10, 8), eye, [side * 0.06, 0.35, -0.19]);
      addPart(`shoulder-${side}`, new THREE.SphereGeometry(0.09, 12, 10), metal, [side * 0.26, 0.08, 0]);
      addPart(`repair-arm-${side}`, new THREE.CapsuleGeometry(0.04, 0.26, 4, 8), paint, [side * 0.29, -0.16, 0], [0, 0, side * 0.12]);
      addPart(`repair-leg-${side}`, new THREE.CapsuleGeometry(0.05, 0.2, 4, 8), paint, [side * 0.12, -0.39, 0]);
      addPart(`foot-${side}`, new THREE.BoxGeometry(0.11, 0.06, 0.16), metal, [side * 0.12, -0.54, -0.025]);
    }
  } else {
    const blue = material(THREE, COLORS.biggyBlue, { metalness: 0.45, roughness: 0.5 });
    const rust = material(THREE, COLORS.biggyRust, { metalness: 0.36, roughness: 0.58 });
    const eye = new THREE.MeshStandardMaterial({ color: COLORS.ivory, emissive: COLORS.ivory, emissiveIntensity: 1.6, roughness: 0.22 });
    const belly = addPart('armored-belly', new THREE.SphereGeometry(0.34, 18, 14), rust, [0, -0.02, -0.015]);
    belly.scale.set(1.08, 1.02, 0.95);
    const helmet = addPart('blue-helmet', new THREE.SphereGeometry(0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), blue, [0, 0.23, 0]);
    helmet.scale.set(1.05, 0.82, 1);
    for (const side of [-1, 1]) {
      addPart(`eye-${side}`, new THREE.SphereGeometry(0.045, 10, 8), eye, [side * 0.12, 0.26, -0.29]);
      addPart(`arm-${side}`, new THREE.CapsuleGeometry(0.08, 0.2, 4, 8), blue, [side * 0.36, -0.12, 0], [0, 0, side * 0.12]);
      addPart(`leg-${side}`, new THREE.CylinderGeometry(0.09, 0.11, 0.16, 12), metal, [side * 0.14, -0.39, 0]);
      addPart(`foot-${side}`, new THREE.SphereGeometry(0.1, 12, 8), dark, [side * 0.14, -0.5, -0.04]);
    }
    addPart('antenna', new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), metal, [0, 0.57, 0]);
  }
  return robot;
}

function addSeating(THREE, scene, seating, elevation, seatMaterial) {
  const width = seating.bounds.maxX - seating.bounds.minX;
  const depth = seating.bounds.maxZ - seating.bounds.minZ;
  const rowSpacing = depth / seating.rows;
  const seatSpacing = 0.72;
  const seatsPerRow = Math.max(1, Math.floor(width / seatSpacing));
  const count = seating.rows * seatsPerRow;
  const rotation = seating.facing === 'north' ? 0 : Math.PI;
  const baseGeometry = new THREE.BoxGeometry(0.56, 0.16, 0.44);
  const backGeometry = new THREE.BoxGeometry(0.56, 0.42, 0.13);
  const bases = new THREE.InstancedMesh(baseGeometry, seatMaterial, count);
  const backs = new THREE.InstancedMesh(backGeometry, seatMaterial, count);
  bases.name = `${seating.id}-seat-bases`;
  backs.name = `${seating.id}-seat-backs`;
  const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const backOffset = new THREE.Vector3(0, 0, -0.22).applyQuaternion(quaternion);
  let index = 0;
  for (let row = 0; row < seating.rows; row += 1) {
    const z = seating.bounds.minZ + rowSpacing * (row + 0.5);
    for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex += 1) {
      const x = seating.bounds.minX + width * (seatIndex + 0.5) / seatsPerRow;
      position.set(x, elevation + 0.42, z);
      matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
      bases.setMatrixAt(index, matrix);
      position.add(backOffset).y += 0.25;
      matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
      backs.setMatrixAt(index, matrix);
      index += 1;
    }
  }
  bases.instanceMatrix.needsUpdate = true;
  backs.instanceMatrix.needsUpdate = true;
  bases.castShadow = true;
  backs.castShadow = true;
  scene.add(bases, backs);
  return count;
}

function addStair(THREE, scene, stair, materials) {
  const dx = stair.upper.x - stair.lower.x;
  const dz = stair.upper.z - stair.lower.z;
  const run = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const pitch = Math.atan2(stair.upper.y - stair.lower.y, run);
  const stepCount = Math.max(1, Math.round((stair.upper.y - stair.lower.y) / 0.25));
  const stepDepth = run / stepCount;
  const rise = (stair.upper.y - stair.lower.y) / stepCount;
  const steps = new THREE.Group();
  steps.name = `${stair.id}-treads`;
  const treadGeometry = new THREE.BoxGeometry(stair.width, 0.12, stepDepth + 0.04);
  for (let index = 0; index < stepCount; index += 1) {
    const progress = (index + 0.5) / stepCount;
    const tread = new THREE.Mesh(treadGeometry, materials.stair);
    tread.position.set(
      stair.lower.x + dx * progress,
      stair.lower.y + rise * (index + 0.5),
      stair.lower.z + dz * progress
    );
    tread.rotation.y = angle;
    tread.castShadow = true;
    tread.receiveShadow = true;
    steps.add(tread);
  }
  scene.add(steps);
  const railLength = Math.hypot(run, stair.upper.y - stair.lower.y);
  const railGeometry = new THREE.BoxGeometry(0.1, 0.1, railLength);
  const perpendicularX = Math.cos(angle);
  const perpendicularZ = -Math.sin(angle);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(railGeometry, materials.rail);
    rail.position.set(
      (stair.lower.x + stair.upper.x) / 2 + perpendicularX * side * (stair.width / 2 - 0.12),
      (stair.lower.y + stair.upper.y) / 2 + 0.95,
      (stair.lower.z + stair.upper.z) / 2 + perpendicularZ * side * (stair.width / 2 - 0.12)
    );
    rail.rotation.set(-pitch, angle, 0);
    rail.castShadow = true;
    scene.add(rail);
  }
  return { stepCount, run };
}

export function createVenueScene(THREE, layout) {
  const scene = new THREE.Scene();
  scene.name = 'Kinepolis Antwerp';
  scene.background = new THREE.Color(COLORS.background);
  scene.fog = new THREE.Fog(COLORS.background, 85, 180);

  const materials = {
    publicFloor: material(THREE, COLORS.publicFloor, { roughness: 0.45 }),
    cinemaFloor: material(THREE, COLORS.cinemaFloor, { roughness: 0.9 }),
    wall: material(THREE, COLORS.wall),
    auditoriumWall: material(THREE, COLORS.auditoriumWall, { roughness: 0.94 }),
    carpet: material(THREE, COLORS.carpet, { roughness: 0.98 }),
    ceiling: material(THREE, COLORS.ceiling, { transparent: true, opacity: 0.08, depthWrite: false }),
    seat: material(THREE, COLORS.seat, { roughness: 0.84 }),
    stair: material(THREE, COLORS.stair, { roughness: 0.58 }),
    rail: material(THREE, COLORS.rail, { metalness: 0.68, roughness: 0.3 }),
    frame: material(THREE, COLORS.amber, { metalness: 0.48, roughness: 0.36 })
  };

  const ambient = new THREE.HemisphereLight(0xd8e1db, 0x3e3632, 2.2);
  ambient.name = 'venue-ambient';
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffd6a0, 2.4);
  keyLight.name = 'foyer-key-light';
  keyLight.position.set(35, 28, 22);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  scene.add(keyLight);
  for (const position of [{ x: 35, y: 7.5, z: 27 }, { x: 18, y: 4, z: 16 }, { x: 48, y: 4, z: 16 }]) {
    const light = new THREE.PointLight(0xeacb98, 16, 18, 2);
    light.position.set(position.x, position.y, position.z);
    scene.add(light);
  }

  for (const level of Object.values(layout.levels)) {
    const floorMaterial = level.id === 'ground' ? materials.publicFloor : materials.cinemaFloor;
    for (const [index, area] of level.walkableAreas.entries()) {
      makePlane(THREE, scene, `${level.id}-floor-${index}`, area, level.elevation, floorMaterial);
    }
  }

  for (const auditorium of layout.rooms.filter(({ type }) => type === 'auditorium')) {
    const elevation = layout.levels[auditorium.level].elevation;
    makePlane(THREE, scene, `${auditorium.id}-carpet`, {
      minX: auditorium.x,
      maxX: auditorium.x + auditorium.width,
      minZ: auditorium.z,
      maxZ: auditorium.z + auditorium.depth
    }, elevation + 0.005, materials.carpet);
  }

  const colliders = [];
  for (const wall of layout.walls) {
    const roomData = layout.rooms.find(({ id }) => id === wall.roomId);
    const wallMaterial = roomData?.type === 'auditorium' ? materials.auditoriumWall : materials.wall;
    makeBox(THREE, scene, wall.id, wall, wallMaterial);
    colliders.push({ kind: 'wall', ...wall });
  }

  for (const door of layout.doors) addDoorFrame(THREE, scene, door, materials.frame);
  for (const auditorium of layout.rooms.filter(({ type }) => type === 'auditorium')) {
    addAuditoriumSign(THREE, scene, auditorium, layout.levels[auditorium.level]);
  }

  let totalSeatCount = 0;
  for (const seating of layout.seating) {
    const level = layout.levels[seating.level];
    totalSeatCount += addSeating(THREE, scene, seating, level.elevation, materials.seat);
    colliders.push({
      kind: 'seating',
      id: seating.id,
      roomId: seating.roomId,
      level: seating.level,
      minX: seating.bounds.minX,
      maxX: seating.bounds.maxX,
      minZ: seating.bounds.minZ,
      maxZ: seating.bounds.maxZ,
      minY: level.elevation,
      maxY: level.elevation + ROBOT_HEIGHT
    });
  }

  const stairs = new Map();
  for (const stair of layout.stairs) {
    stairs.set(stair.id, addStair(THREE, scene, stair, materials));
  }

  for (const roomData of layout.rooms) {
    if (roomData.type === 'corridor' || roomData.type === 'stairwell') continue;
    const level = layout.levels[roomData.level];
    const ceilingHeight = roomData.type === 'exhibition' ? 7.5 : 3.6;
    const ceiling = makePlane(THREE, scene, `${roomData.id}-ceiling`, {
      minX: roomData.x,
      maxX: roomData.x + roomData.width,
      minZ: roomData.z,
      maxZ: roomData.z + roomData.depth
    }, level.elevation + ceilingHeight, materials.ceiling);
    ceiling.castShadow = false;
  }

  const objectiveMarkers = new Map();
  for (const objective of layout.objectives) {
    const color = OBJECTIVE_COLORS[objective.id] ?? COLORS.amber;
    const markerMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.7,
      metalness: 0.5,
      roughness: 0.25
    });
    const beamMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    });
    const marker = new THREE.Group();
    marker.name = `${objective.id}-objective-marker`;
    marker.position.set(objective.position.x, objective.position.y, objective.position.z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 8, 32), markerMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.72, 12), markerMaterial);
    beacon.position.y = 0.48;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 8.5, 16, 1, true), beamMaterial);
    beam.name = `${objective.id}-navigation-beam`;
    beam.position.y = 4.25;
    marker.add(ring, beacon, beam);
    scene.add(marker);
    objectiveMarkers.set(objective.id, marker);
  }

  const systemEffects = new Map();
  const routeGuidance = new THREE.Group();
  routeGuidance.name = 'beacon-route-guidance';
  routeGuidance.visible = false;
  const routeMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.cyan,
    emissive: COLORS.cyan,
    emissiveIntensity: 2.2,
    roughness: 0.32
  });
  for (const point of [
    { x: 23, y: 0.12, z: 25 }, { x: 29, y: 0.12, z: 25 }, { x: 34, y: 0.12, z: 24 },
    { x: 35, y: 2.35, z: 26.25 }, { x: 35, y: 4.62, z: 30.5 }, { x: 29, y: 4.62, z: 32 }
  ]) {
    const node = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), routeMaterial);
    node.position.set(point.x, point.y, point.z);
    routeGuidance.add(node);
  }
  scene.add(routeGuidance);
  systemEffects.set('beacon', routeGuidance);

  const cinemaScreen = new THREE.Group();
  cinemaScreen.name = 'power-auditorium-screen';
  cinemaScreen.visible = false;
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.blue,
    emissive: COLORS.blue,
    emissiveIntensity: 2.4,
    roughness: 0.2
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.5, 0.08), screenMaterial);
  screen.position.set(25.5, 6.3, 45.78);
  const projectorGlow = new THREE.PointLight(COLORS.blue, 18, 12, 2);
  projectorGlow.position.set(25.5, 6.1, 42);
  cinemaScreen.add(screen, projectorGlow);
  scene.add(cinemaScreen);
  systemEffects.set('power', cinemaScreen);

  const foyerLights = new THREE.Group();
  foyerLights.name = 'gate-foyer-lights';
  foyerLights.visible = false;
  for (const position of [{ x: 32, y: 7, z: 27 }, { x: 38, y: 7, z: 27 }]) {
    const light = new THREE.PointLight(COLORS.orange, 18, 14, 2);
    light.position.set(position.x, position.y, position.z);
    foyerLights.add(light);
  }
  scene.add(foyerLights);
  systemEffects.set('gate', foyerLights);

  const spawnPoints = {
    voxxy: { x: 8, y: layout.levels.ground.elevation, z: 25 },
    droid: { x: 23, y: layout.levels.cinema.elevation, z: 16 },
    biggy: { x: 27, y: layout.levels.ground.elevation, z: 25 }
  };
  for (const [id, point] of Object.entries(spawnPoints)) {
    const mesh = createRobotMesh(THREE, id);
    mesh.position.set(point.x, point.y + 0.4, point.z);
    scene.add(mesh);
    point.mesh = mesh;
  }

  return {
    scene,
    colliders,
    spawnPoints,
    objectiveMarkers,
    systemEffects,
    setCompletedObjectives(completedObjectiveIds) {
      const completed = new Set(completedObjectiveIds);
      for (const [objectiveId, effect] of systemEffects) effect.visible = completed.has(objectiveId);
    },
    bounds: { ...layout.bounds },
    stairs,
    totalSeatCount
  };
}
