const floorPlan = document.querySelector('#floor-plan');
const startModal = document.querySelector('#start-modal');
const endModal = document.querySelector('#end-modal');
const timerElement = document.querySelector('#timer');
const statusCopy = document.querySelector('#status-copy');
const missionMessage = document.querySelector('#mission-message');
const objectiveCount = document.querySelector('#objective-count');
const coordinateReadout = document.querySelector('#coordinate-readout');
const toast = document.querySelector('#toast');
const pulseRing = document.querySelector('#pulse-ring');

const robotData = {
  voxxy: { name: 'Voxxy', key: '1', speed: 1.5, x: 24, y: 75, objective: 'beacon', message: 'Scan the beacon in the Exhibition Floor.', action: 'SCAN', color: '#70c8bd' },
  droid: { name: 'Droid', key: '2', speed: 0.9, x: 73, y: 26, objective: 'power', message: 'Repair the projector console by Auditorium 03.', action: 'REPAIR', color: '#82a9d5' },
  biggy: { name: 'Biggy', key: '3', speed: 0.62, x: 63, y: 76, objective: 'gate', message: 'Charge the Grand Stair gate.', action: 'CHARGE', color: '#e8784d' }
};

let selectedRobot = 'voxxy';
let active = false;
let secondsLeft = 90;
let lastTime = 0;
let timerId;
const completed = new Set();
const keys = new Set();

function token(robot) { return document.querySelector(`#token-${robot}`); }
function data() { return robotData[selectedRobot]; }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.ceil(seconds % 60)).padStart(2, '0')}`; }

function selectRobot(robot) {
  selectedRobot = robot;
  document.querySelectorAll('.crew-card').forEach((card) => card.classList.toggle('active', card.dataset.select === robot));
  Object.keys(robotData).forEach((name) => token(name).classList.toggle('selected', name === robot));
  missionMessage.textContent = completed.has(robotData[robot].objective) ? `${robotData[robot].name} is online. Choose another specialist.` : robotData[robot].message;
  coordinateReadout.textContent = `${robotData[robot].name.toUpperCase()} / ${zoneName(robotData[robot].x, robotData[robot].y)}`;
}

function zoneName(x, y) {
  if (y > 63 && x < 38) return 'EXHIBITION FLOOR';
  if (y > 40 && x < 68) return 'FOYER';
  if (y > 40 && x >= 56 && x < 75) return 'GRAND STAIR';
  if (y < 38 && x < 68) return 'AUDITORIUMS 01-03';
  return 'CORRIDOR / CINEMA LEVEL';
}

function renderPositions() {
  Object.entries(robotData).forEach(([name, robot]) => {
    const element = token(name);
    element.style.left = `${robot.x}%`;
    element.style.top = `${robot.y}%`;
  });
  coordinateReadout.textContent = `${data().name.toUpperCase()} / ${zoneName(data().x, data().y)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
}

function moveRobot(delta) {
  if (!active) return;
  const robot = data();
  const scale = 0.055;
  robot.x = Math.max(4, Math.min(96, robot.x + delta.x * robot.speed * scale));
  robot.y = Math.max(7, Math.min(93, robot.y + delta.y * robot.speed * scale));
  renderPositions();
}

function activate() {
  if (!active) return;
  const robot = data();
  const objective = document.querySelector(`.objective-${robot.objective}`);
  const targetX = Number.parseFloat(objective.style.left || getComputedStyle(objective).left) / floorPlan.clientWidth * 100;
  const targetY = Number.parseFloat(objective.style.top || getComputedStyle(objective).top) / floorPlan.clientHeight * 100;
  const distance = Math.hypot(robot.x - targetX, (robot.y - targetY) * 1.55);
  if (completed.has(robot.objective)) { showToast(`${robot.name.toUpperCase()} HAS ALREADY DONE THEIR JOB`); return; }
  if (distance > 13) { showToast(`TOO FAR AWAY — MOVE CLOSER TO THE ${robot.objective.toUpperCase()}`); return; }
  completed.add(robot.objective);
  objective.classList.add('done');
  document.querySelector(`#state-${selectedRobot}`).textContent = 'ONLINE';
  document.querySelector(`[data-select="${selectedRobot}"]`).classList.add('complete');
  objectiveCount.textContent = `${completed.size} / 3`;
  pulseRing.style.left = `${robot.x}%`;
  pulseRing.style.top = `${robot.y}%`;
  pulseRing.classList.remove('active');
  void pulseRing.offsetWidth;
  pulseRing.classList.add('active');
  showToast(`${robot.name.toUpperCase()} // ${robot.action} COMPLETE`);
  if (completed.size === 3) finishGame();
  else {
    statusCopy.textContent = `${completed.size} system${completed.size === 1 ? '' : 's'} online`;
    const next = Object.keys(robotData).find((name) => !completed.has(robotData[name].objective));
    selectRobot(next);
  }
}

function finishGame() {
  active = false;
  clearInterval(timerId);
  statusCopy.textContent = 'All systems online';
  document.querySelector('.status-dot').style.background = '#b4d67d';
  document.querySelector('.status-dot').style.boxShadow = '0 0 14px #b4d67d';
  const score = Math.max(72, Math.round((secondsLeft / 90) * 100));
  document.querySelector('#score').textContent = score;
  document.querySelector('#end-signal').textContent = `CIRCUIT COMPLETE // ${formatTime(secondsLeft)} REMAINING`;
  document.querySelector('#end-copy').textContent = `Voxxy scanned, Droid repaired, and Biggy charged the building. The first keynote can begin on time.`;
  setTimeout(() => endModal.classList.remove('hidden'), 650);
}

function resetGame(showStart = true) {
  clearInterval(timerId);
  secondsLeft = 90;
  completed.clear();
  Object.assign(robotData.voxxy, { x: 24, y: 75 });
  Object.assign(robotData.droid, { x: 73, y: 26 });
  Object.assign(robotData.biggy, { x: 63, y: 76 });
  document.querySelectorAll('.objective').forEach((item) => item.classList.remove('done'));
  document.querySelectorAll('.crew-card').forEach((card) => card.classList.remove('complete'));
  document.querySelectorAll('.crew-state').forEach((state) => state.textContent = 'READY');
  objectiveCount.textContent = '0 / 3';
  timerElement.textContent = formatTime(secondsLeft);
  timerElement.style.color = 'var(--amber)';
  statusCopy.textContent = 'Systems asleep';
  document.querySelector('.status-dot').style.background = 'var(--danger)';
  document.querySelector('.status-dot').style.boxShadow = '0 0 14px var(--danger)';
  active = false;
  renderPositions();
  selectRobot('voxxy');
  endModal.classList.add('hidden');
  if (showStart) startModal.classList.remove('hidden');
}

function startGame() {
  active = true;
  startModal.classList.add('hidden');
  floorPlan.focus();
  statusCopy.textContent = 'Mission active';
  timerId = setInterval(() => {
    secondsLeft -= 1;
    timerElement.textContent = formatTime(secondsLeft);
    if (secondsLeft <= 15) timerElement.style.color = 'var(--danger)';
    if (secondsLeft <= 0) {
      active = false;
      showToast('THE DOORS OPENED — SHIFT FAILED');
      setTimeout(() => resetGame(true), 1800);
    }
  }, 1000);
}

document.querySelectorAll('[data-select]').forEach((card) => card.addEventListener('click', () => selectRobot(card.dataset.select)));
document.querySelector('#start-button').addEventListener('click', startGame);
document.querySelector('#again-button').addEventListener('click', () => { resetGame(false); startGame(); });
document.querySelector('#reset-button').addEventListener('click', () => resetGame(true));
document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  const key = event.key.toLowerCase();
  if (['1', '2', '3'].includes(key)) selectRobot(Object.keys(robotData)[Number(key) - 1]);
  if (key === 'e' || key === 'enter') activate();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) { event.preventDefault(); keys.add(key); }
});
document.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
function loop(time) {
  const elapsed = Math.min((time - lastTime) / 16.67 || 1, 3);
  lastTime = time;
  let x = 0; let y = 0;
  if (keys.has('a') || keys.has('arrowleft')) x -= elapsed;
  if (keys.has('d') || keys.has('arrowright')) x += elapsed;
  if (keys.has('w') || keys.has('arrowup')) y -= elapsed;
  if (keys.has('s') || keys.has('arrowdown')) y += elapsed;
  if (x || y) moveRobot({ x, y });
  requestAnimationFrame(loop);
}

renderPositions();
selectRobot('voxxy');
requestAnimationFrame(loop);