import * as THREE from 'three';
import { createVenueScene } from './venue-scene.js';
import { createRobotController } from './robot-controller.js';
import { createMission } from './mission.js';
import { venueLayout } from './venue-layout.js';
import { stairHeightAt } from './collision.js';

const gameView = document.querySelector('#game-view');
if (!gameView) throw new Error('Missing #game-view mount point.');

const ui = {
  startModal: document.querySelector('#start-modal'),
  endModal: document.querySelector('#end-modal'),
  startButton: document.querySelector('#start-button'),
  exploreButton: document.querySelector('#explore-button'),
  againButton: document.querySelector('#again-button'),
  resetButton: document.querySelector('#reset-button'),
  timer: document.querySelector('#timer'),
  status: document.querySelector('#status-copy'),
  missionMessage: document.querySelector('#mission-message'),
  objectiveCount: document.querySelector('#objective-count'),
  coordinateReadout: document.querySelector('#coordinate-readout'),
  endSignal: document.querySelector('#end-signal'),
  endTitle: document.querySelector('#end-title'),
  endCopy: document.querySelector('#end-copy'),
  score: document.querySelector('#score')
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(gameView.clientWidth, gameView.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.domElement.setAttribute('aria-label', 'Three-dimensional Kinepolis environment');
renderer.domElement.tabIndex = 0;
renderer.domElement.style.touchAction = 'none';
gameView.prepend(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 240);
camera.position.set(45, 54, 73);
camera.lookAt(32, 2, 23);
const venue = createVenueScene(THREE, venueLayout);
const robotController = createRobotController({
  THREE,
  camera,
  canvas: renderer.domElement,
  layout: venueLayout,
  colliders: venue.colliders,
  spawnPoints: venue.spawnPoints
});
const mission = createMission({
  robots: robotController.robots,
  objectives: venueLayout.objectives.map((objective) => ({ ...objective, interactionRadius: 2.2 })),
  durationSeconds: 90
});

const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);
const movementButtons = { up: 'w', left: 'a', down: 's', right: 'd' };
let frameId = 0;
let missionWasFailed = false;
let freeRoamAnnounced = false;
let lastFrameTime = performance.now();

function formatTime(seconds) {
  const remaining = Math.ceil(seconds);
  return `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
}

function currentArea(robot) {
  const stair = venueLayout.stairs.find((candidate) => stairHeightAt(robot.x, robot.z, candidate, robot.radius) !== null);
  if (stair) return 'GRAND STAIR';
  const level = Math.abs(robot.y - venueLayout.levels.ground.elevation) < 0.8 ? 'ground' : 'cinema';
  const candidates = venueLayout.rooms
    .filter((room) => room.level === level)
    .sort((left, right) => {
      const priority = { auditorium: 0, reception: 1, exhibition: 2, foyer: 3, meeting: 4, corridor: 5 };
      return (priority[left.type] ?? 6) - (priority[right.type] ?? 6);
    });
  const room = candidates.find((candidate) => (
    robot.x >= candidate.x && robot.x <= candidate.x + candidate.width
    && robot.z >= candidate.z && robot.z <= candidate.z + candidate.depth
  ));
  return room ? `${room.name.toUpperCase()} / ${level === 'ground' ? 'GROUND FLOOR' : 'CINEMA LEVEL'}` : (level === 'ground' ? 'GROUND FLOOR' : 'CINEMA LEVEL');
}

function updateCoordinateReadout() {
  const robot = robotController.robots[robotController.activeRobotId];
  ui.coordinateReadout.textContent = `${robot.name.toUpperCase()} / ${currentArea(robot)}`;
  ui.coordinateReadout.dataset.x = robot.x.toFixed(2);
  ui.coordinateReadout.dataset.y = robot.y.toFixed(2);
  ui.coordinateReadout.dataset.z = robot.z.toFixed(2);
}

function hideEndModal() {
  ui.endModal.classList.add('hidden');
  missionWasFailed = false;
}

function renderMission(state) {
  ui.timer.textContent = formatTime(state.secondsLeft);
  ui.timer.style.color = state.secondsLeft <= 15 && !state.freeRoam ? 'var(--danger)' : 'var(--amber)';
  ui.status.textContent = state.failed ? 'Shift failed' : state.freeRoam ? 'Free exploration' : state.active ? 'Mission active' : 'Systems asleep';
  ui.missionMessage.textContent = state.message;
  ui.objectiveCount.textContent = `${state.completedObjectiveIds.length} / ${venueLayout.objectives.length}`;
  document.querySelectorAll('.crew-card').forEach((card) => {
    const id = card.dataset.select;
    const robot = robotController.robots[id];
    const isComplete = state.completedObjectiveIds.includes(robot.objectiveId);
    card.classList.toggle('active', id === state.selectedRobotId);
    card.classList.toggle('complete', isComplete);
    const crewState = card.querySelector('.crew-state');
    if (crewState) crewState.textContent = isComplete ? 'ONLINE' : 'READY';
  });
  for (const objective of venueLayout.objectives) {
    const marker = venue.objectiveMarkers.get(objective.id);
    if (marker) marker.visible = !state.completedObjectiveIds.includes(objective.id);
  }
  if (robotController.activeRobotId !== state.selectedRobotId) robotController.selectRobot(state.selectedRobotId);
  updateCoordinateReadout();
  if (state.failed && !missionWasFailed) {
    missionWasFailed = true;
    ui.exploreButton.classList.add('hidden');
    ui.againButton.innerHTML = 'Try another shift <span>↻</span>';
    ui.endSignal.textContent = 'SHIFT FAILED // TIME EXPIRED';
    ui.endTitle.innerHTML = 'The doors<br><em>are open.</em>';
    ui.endCopy.textContent = 'The building did not wake in time. Reset and route the specialists again.';
    ui.score.textContent = '0';
    ui.endModal.classList.remove('hidden');
  }
  if (state.freeRoam && !freeRoamAnnounced) {
    freeRoamAnnounced = true;
    ui.exploreButton.classList.remove('hidden');
    ui.againButton.innerHTML = 'Run another shift <span>↻</span>';
    ui.endSignal.textContent = 'CIRCUIT COMPLETE';
    ui.endTitle.innerHTML = 'The building<br><em>is awake.</em>';
    ui.endCopy.textContent = 'All three systems are online. The building is open to explore.';
    ui.score.textContent = String(Math.max(72, Math.round((state.secondsLeft / 90) * 100)));
    ui.endModal.classList.remove('hidden');
  }
}

function startGame() {
  if (!mission.start()) return;
  ui.startModal.classList.add('hidden');
  ui.endModal.classList.add('hidden');
  renderer.domElement.focus({ preventScroll: true });
}

function resetGame(showStart = true) {
  mission.restart();
  hideEndModal();
  freeRoamAnnounced = false;
  if (showStart) ui.startModal.classList.remove('hidden');
  else ui.startModal.classList.add('hidden');
  for (const marker of venue.objectiveMarkers.values()) marker.visible = true;
  renderMission(mission.state);
}

function activateSelectedRobot() {
  const robot = robotController.robots[robotController.activeRobotId];
  mission.activate({ x: robot.x, y: robot.y, z: robot.z });
}

document.querySelectorAll('[data-select]').forEach((card) => {
  card.addEventListener('click', () => {
    robotController.selectRobot(card.dataset.select);
    mission.selectRobot(card.dataset.select);
    renderer.domElement.focus({ preventScroll: true });
  });
});
ui.startButton.addEventListener('click', startGame);
ui.exploreButton.addEventListener('click', () => {
  ui.endModal.classList.add('hidden');
  renderer.domElement.focus({ preventScroll: true });
});
ui.againButton.addEventListener('click', () => {
  resetGame(false);
  startGame();
});
ui.resetButton.addEventListener('click', () => resetGame(true));
mission.subscribe(renderMission);

document.addEventListener('keydown', (event) => {
  if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  if (movementKeys.has(key)) {
    event.preventDefault();
    robotController.setInput(key, true);
    return;
  }
  if (event.repeat) return;
  if (['1', '2', '3'].includes(key)) {
    const id = ['voxxy', 'droid', 'biggy'][Number(key) - 1];
    robotController.selectRobot(id);
    mission.selectRobot(id);
  } else if (key === 'e' || key === 'enter') {
    event.preventDefault();
    activateSelectedRobot();
  }
});
document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (movementKeys.has(key)) robotController.setInput(key, false);
});
window.addEventListener('blur', () => {
  for (const key of movementKeys) robotController.setInput(key, false);
});

document.querySelectorAll('[data-move]').forEach((button) => {
  const key = movementButtons[button.dataset.move];
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    robotController.setInput(key, true);
  });
  const release = (event) => {
    event.preventDefault();
    robotController.setInput(key, false);
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', (event) => release(event));
  button.addEventListener('lostpointercapture', () => robotController.setInput(key, false));
  button.addEventListener('click', () => {
    robotController.setInput(key, true);
    window.setTimeout(() => robotController.setInput(key, false), 260);
  });
});

const resizeObserver = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
resizeObserver.observe(gameView);

function animate(timestamp) {
  const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
  lastFrameTime = timestamp;
  mission.tick(deltaSeconds);
  const state = mission.state;
  if (state.active || state.freeRoam) {
    robotController.update(deltaSeconds);
    updateCoordinateReadout();
  }
  renderer.render(venue.scene, camera);
  frameId = window.requestAnimationFrame(animate);
}

frameId = window.requestAnimationFrame(animate);
window.addEventListener('pagehide', () => {
  window.cancelAnimationFrame(frameId);
  resizeObserver.disconnect();
  renderer.dispose();
});