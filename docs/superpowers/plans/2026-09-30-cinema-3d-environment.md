# Cinema 3D Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat venue map with a playable, collision-aware, two-floor 3D Kinepolis environment connected by a climbable grand staircase, while retaining the robot mission and unlocking free exploration afterward.

**Architecture:** Use Vite to serve a modular Three.js application. Keep traced venue dimensions and collision-relevant layout in pure JavaScript data; use that data to construct both visible scene geometry and collision shapes. Separate scene rendering, robot movement/collision, mission state, and DOM wiring so layout and movement rules can be tested independently.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Three.js, Vite, Node.js built-in test runner, browser-based Playwright validation.

## Global Constraints

- Use one shared world coordinate system; 1 scene unit equals 1 metre.
- Set the ground-floor finished floor to Y = 0 m and the first-floor finished floor to Y = 4.5 m.
- Use a typical 3.6 m clear room height; raise the exhibition hall where needed to keep its volume open.
- Model an approximately 4 m-wide grand staircase with visible steps and a continuous walkable ramp collider.
- Use approximately 1.8 m-wide, 2.2 m-high double-door openings and at least 2 m clear main corridors where source dimensions are ambiguous.
- Use an approximately 0.8 m-tall, 0.55 m-wide robot collider; retain character-specific movement speeds.
- Treat materials and dimensions as documented visual estimates, not surveyed venue measurements.
- Do not render plan images as playable floor textures or claim survey accuracy.
- Keep all runtime assets local; preserve the current robot crew UI references.
- Keep the timed three-robot mission and unlock untimed free exploration when it is complete.

---

## File Structure

- Create `package.json` and `package-lock.json` for local `three`, `vite`, and Node test/build scripts.
- Modify `index.html` to mount the WebGL canvas, load the ES module entry point, and retain accessible game controls/status elements.
- Modify `styles.css` for a stable, responsive 3D viewport, canvas sizing, and controls layout.
- Create `src/venue-layout.js` for traced room footprints, wall segments/openings, seating banks, entrances, floors, stairs, and objective locations.
- Create `src/collision.js` for vertically filtered wall/seat collision resolution and floor/ramp elevation sampling.
- Create `src/venue-scene.js` for Three.js scene, lighting, materials, meshes, and scene/collision assembly.
- Create `src/robot-controller.js` for keyboard input, weighted robot movement, floor contact, and follow-camera updates.
- Create `src/mission.js` for robot roster, selection, objective validation, timer, completion, and free-roam state.
- Create `src/main.js` to initialize the renderer, scene, UI, controllers, and animation loop.
- Create `tests/venue-layout.test.js`, `tests/collision.test.js`, `tests/robot-controller.test.js`, and `tests/mission.test.js` using `node:test`.
- Modify `README.md` with install/run/build/test instructions and a concise description of assumptions and reference sources.
- Modify `github/ASSET-SOURCES.md` only if implementation adds or changes asset usage; retain source/rights notes for supplied photos.
- Remove the obsolete root `game.js` after its mission/input behavior has been migrated into modules.

## Task 1: Add the Local Three.js Toolchain

**Files:**
- Create: `package.json`, `package-lock.json`
- Create: `src/main.js`
- Modify: `index.html`

**Interfaces:**
- Produces npm scripts `dev`, `build`, `preview`, and `test`.
- The entry point will be `src/main.js`; the test command will use Node's built-in test runner (`node --test`).

- [x] **Step 1: Add Three.js and Vite dependencies**

Run:

```sh
npm install three
npm install --save-dev vite
```

Expected: `package.json` and `package-lock.json` are generated with `three` as a runtime dependency and `vite` as a development dependency.

- [x] **Step 2: Define app scripts and module entry**

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test"
  }
}
```

Change the bottom of `index.html` to load the new module entry instead of the old script:

```html
<script type="module" src="/src/main.js"></script>
```

Create a minimal `src/main.js` that selects the app mount node and reports a visible initialization message until the renderer task replaces it. Add `<div id="game-view" aria-label="3D Kinepolis game view"></div>` inside the existing playfield panel so the canvas has a stable mount point.

- [x] **Step 3: Verify the starter builds and tests**

Run: `npm test`

Expected: PASS with zero tests discovered and no test-runner errors.

Run: `npm run build`

Expected: Vite emits a production bundle in `dist/` and exits with code 0.

## Task 2: Trace a Shared Two-Floor Layout

**Files:**
- Create: `src/venue-layout.js`
- Create: `tests/venue-layout.test.js`

**Interfaces:**
- Export `venueLayout`, an immutable object with `units`, `levels`, `bounds`, `rooms`, `walls`, `seating`, `stairs`, `entrances`, and `objectives`.
- Coordinates use X/Z for the plan and Y for elevation. Wall and seating collision data are expressed as axis-aligned bounds in world metres.
- Each wall entry is `{ id, level, minX, maxX, minZ, maxZ, minY, maxY }`. Door openings are represented by separated wall segments, not boolean flags on a solid wall.
- Each walkable level entry is `{ id, elevation, bounds: { minX, maxX, minZ, maxZ } }`.
- `stairs` is an array; each stair entry is `{ id, width, lower: { x, z, y, roomId }, upper: { x, z, y, roomId }, length }`.

- [x] **Step 1: Write layout invariant tests**

Create `tests/venue-layout.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { venueLayout } from '../src/venue-layout.js';

test('venue layout defines stacked levels at the assumed elevations', () => {
  assert.equal(venueLayout.units, 'metres');
  assert.equal(venueLayout.levels.ground.elevation, 0);
  assert.equal(venueLayout.levels.cinema.elevation, 4.5);
});

test('stair landings connect the exhibition hall to the first-floor foyer', () => {
  const grandStair = venueLayout.stairs.find((stair) => stair.id === 'grand-stair');
  assert.ok(grandStair);
  assert.equal(grandStair.lower.roomId, 'exhibition-hall');
  assert.equal(grandStair.upper.roomId, 'foyer');
  assert.equal(grandStair.lower.y, venueLayout.levels.ground.elevation);
  assert.equal(grandStair.upper.y, venueLayout.levels.cinema.elevation);
});

test('all rooms and objectives reference valid levels and rooms', () => {
  const roomIds = new Set(venueLayout.rooms.map((room) => room.id));
  for (const room of venueLayout.rooms) assert.ok(venueLayout.levels[room.level]);
  for (const objective of venueLayout.objectives) {
    assert.ok(roomIds.has(objective.roomId));
    assert.ok(venueLayout.levels[objective.level]);
  }
});

test('walls have positive dimensions and are split at planned doorways', () => {
  assert.ok(venueLayout.walls.length > 0);
  for (const wall of venueLayout.walls) {
    assert.ok(wall.maxX > wall.minX, wall.id);
    assert.ok(wall.maxZ > wall.minZ, wall.id);
    assert.ok(wall.maxY > wall.minY, wall.id);
  }
});
```

- [x] **Step 2: Run the layout tests and confirm the initial failure**

Run: `npm test`

Expected: FAIL because `src/venue-layout.js` does not yet exist.

- [x] **Step 3: Trace plan-derived layout data**

Inspect `github/assets/maps/exhibition-floor.jpg`, `github/assets/maps/hollywood-area.png`, `github/assets/maps/cinema-venue-devoxx.png`, and `github/assets/maps/devoxx-rooms.jpg` side by side. In `src/venue-layout.js`, define both floors in one coordinate system, anchoring their alignment at the stair/foyer connection. Trace each identifiable auditorium footprint and orientation, shared corridor, entrance, exhibition-hall connection, foyer, and stair landing. Add seating-bank footprints that follow the visible rows and keep room entrances, side aisles, and cross-aisles unblocked. Put mission objectives in corresponding rooms across both levels.

Populate the exported `venueLayout` object with complete plan-traced records for both levels. Include the assumed elevations, world bounds, room records, vertically bounded wall records, seating-bank bounds, stair width/length/landings, entrance positions, and objective positions. Choose final bounds from plan proportions and the documented assumptions; do not leave empty collections or sample coordinates in the exported data.

- [x] **Step 4: Run layout tests and review plan fidelity**

Run: `npm test`

Expected: all layout tests PASS.

Manually compare the two floor data plots against the source plans. Confirm the upper stair landing is in the foyer, auditorium order/orientation follows the cinema plan, and ground-floor entrances and exhibition connections remain in their shown relative positions.

## Task 3: Add Walkable Collision and Elevation Rules

**Files:**
- Create: `src/collision.js`
- Create: `tests/collision.test.js`

**Interfaces:**
- `resolveMovement(position, delta, radius, height, colliders)` returns `{ x, z }` after resolving collisions, using axis-separated movement to slide along walls. `position` includes `{ x, y, z }`; only colliders whose vertical bounds overlap the robot body at `position.y` are considered.
- `floorHeightAt(x, z, layout, currentY)` returns a reachable floor or stair-ramp elevation near `currentY`, or `null` if no walkable surface is reachable at that position. It must not snap a ground-floor robot to the upper floor merely because both floors share X/Z bounds.
- `stairHeightAt(x, z, stair, radius)` returns the linear ramp elevation when the point lies within stair bounds, otherwise `null`.
- Static wall and seat colliders use the same bounds as the visible geometry.

- [x] **Step 1: Write collision and stair tests**

Create tests with explicit AABB fixtures and assertions for unobstructed movement, wall stopping and sliding, doorway gaps, seat-bank blocking, vertical floor isolation, floor-height selection by current elevation, midpoint stair interpolation to 2.25 m, and `null` when outside all walkable bounds.

Use `node:test` and `node:assert/strict`, import the exact functions from `src/collision.js`, and keep each behavior in its own named test.

- [x] **Step 2: Run collision tests and confirm the initial failure**

Run: `npm test`

Expected: FAIL because `src/collision.js` does not yet exist.

- [x] **Step 3: Implement axis-separated collision and walkable height sampling**

Implement bounds overlap using the robot's horizontal radius and height. Resolve X and Z independently so collision does not freeze movement along a wall. Ignore wall or seating colliders whose Y interval does not intersect the robot's vertical interval. Treat each stair ramp as a continuous walkable surface between its lower and upper landings; project the current X/Z point onto the lower-to-upper axis, interpolate elevation along that axis, and check lateral distance against half the stair width plus robot radius. Select a floor elevation only when it is within the configured step-up tolerance of the current elevation. Do not add handrails to the collision set.

- [x] **Step 4: Run collision tests**

Run: `npm test`

Expected: all collision tests PASS, including gap traversal, wall sliding, seating blockage, and stair interpolation.

## Task 4: Build the Venue Scene From Layout Data

**Files:**
- Create: `src/venue-scene.js`
- Modify: `styles.css`

**Interfaces:**
- Export `createVenueScene(THREE, layout)` returning `{ scene, colliders, spawnPoints, objectiveMarkers, bounds }`.
- Each object is generated from `venueLayout`; do not encode a second copy of room coordinates in scene-building code.

- [x] **Step 1: Implement the scene assembler**

Create a scene with a restrained cinema-appropriate palette and real-world material variation. Add a floor mesh for each level, segmented walls from layout wall entries, visible doors at wall gaps, floors/ceilings, room signs, seating rows made from repeatable original geometry, entrance markers, and stair tread/handrail geometry. Create an invisible ramp surface matching the stair bounds. Add warm foyer lighting and lower-intensity auditorium aisle lighting. Give auditorium walls and seating dark acoustic finishes, public areas terrazzo/polished stone, general walls pale plaster/concrete, and stair rails metal or wood.

For every wall and seating block, produce its Three.js mesh and collision AABB from the same layout entry. Return objective marker meshes keyed by the objective id and named spawn points keyed by robot id. Use geometries and materials only; do not fetch external runtime assets.

- [x] **Step 2: Add renderer mount and responsive viewport styling**

In `styles.css`, replace the old background-map treatment for the game viewport with a positioned, overflow-hidden canvas mount. Set canvas width and height to 100%, preserve a minimum usable viewport height, and keep adjacent mission controls readable at widths below 620 px. Respect reduced-motion preferences for nonessential animation.

- [x] **Step 3: Smoke-test generated scene in the browser**

Run: `npm run dev -- --host 127.0.0.1`

Open the served page. Expected: a nonblank WebGL canvas, both floor masses, readable stair/foyer relation, visible auditorium seating, and no console errors. At this stage a static orbit camera is acceptable; movement arrives in Task 5.

## Task 5: Implement Robot Movement and Follow Camera

**Files:**
- Create: `src/robot-controller.js`
- Create: `tests/robot-controller.test.js`

**Interfaces:**
- `createRobotController({ THREE, camera, canvas, layout, colliders, spawnPoints })` returns `{ robots, selectRobot(id), setInput(key, pressed), update(deltaSeconds), activeRobotId }`.
- Robot definitions retain ids `voxxy`, `droid`, and `biggy`, their current names, colors, initial mission roles, and relative speeds.
- Each robot has a body mesh and a horizontal collision radius of 0.275 m. Movement uses acceleration/deceleration so robots feel weighted rather than teleporting.

- [x] **Step 1: Write movement tests for pure controller rules**

Cover key normalization, selecting a robot, distinct speed values, diagonal input normalization, wall-collision integration, floor contact, and stair ascent/descent. Factor the kinematic calculation into exported pure function `advanceRobotState(state, input, deltaSeconds, layout, colliders)` so tests do not need a browser or WebGL context.

- [x] **Step 2: Run movement tests and confirm the initial failure**

Run: `npm test`

Expected: FAIL because `src/robot-controller.js` does not yet exist.

- [x] **Step 3: Implement weighted movement and camera following**

Use elapsed seconds, not frame counts, for acceleration and movement. Normalize diagonal input; keep horizontal motion on X/Z; resolve against collision bounds; update robot Y from `floorHeightAt`/`stairHeightAt` using its current elevation; reject vertical shortcuts through the upper slab. Smoothly follow the active robot from behind and above, clamping camera distance to venue bounds. Bind WASD and arrow keys to movement while allowing normal interaction with focused buttons.

- [x] **Step 4: Run movement tests**

Run: `npm test`

Expected: all movement tests PASS, with robots stopping at walls, sliding along corridors, retaining distinct speeds, and changing elevation only through walkable surfaces.

## Task 6: Port Mission State and Connect the 3D Interface

**Files:**
- Create: `src/mission.js`
- Create: `tests/mission.test.js`
- Modify: `src/main.js`
- Modify: `index.html`, `styles.css`
- Delete: `game.js`

**Interfaces:**
- `createMission({ robots, objectives, durationSeconds })` returns `{ state, start(), selectRobot(id), activate(position), tick(deltaSeconds), restart(), subscribe(listener) }`.
- Each robot input is `{ id, objectiveId }`; each objective is `{ id, position: { x, y, z }, interactionRadius }`. `activate(position)` checks the active robot's objective against the active robot's current world position.
- State exposes `active`, `failed`, `freeRoam`, `selectedRobotId`, `secondsLeft`, `completedObjectiveIds`, and a user-facing `message`.
- `src/main.js` owns renderer lifecycle, input event listeners, the animation frame loop, DOM updates, and teardown on `pagehide`.

- [x] **Step 1: Write mission-state tests**

Test the inactive initial state, `start()`, valid specialist activation, rejection outside the interaction radius, timeout failure, completion of all three objectives, timer stop/free-roam unlock, and restart clearing failure/objectives and restoring the duration. Keep mission tests independent of the DOM.

- [x] **Step 2: Run mission tests and confirm the initial failure**

Run: `npm test`

Expected: FAIL because `src/mission.js` does not yet exist.

- [x] **Step 3: Implement mission state and objective distance checks**

Initialize robots at traced spawn points. Keep specialist assignments aligned with the existing game: Voxxy scans the exhibition beacon, Droid repairs the projector console by an auditorium, and Biggy charges the stair gate. Place all targets in reachable plan-derived locations. Enforce objective activation by active robot role and the target's 3D interaction radius. `start()` begins the timer and movement; `tick()` counts down only while active. On timeout, set `failed = true`, stop movement, and show the existing failure state. On completion, set `freeRoam = true`, stop the timer, and leave movement active. `restart()` clears completion/failure, resets timer and spawn points, and returns to the start state.

- [x] **Step 4: Run mission tests**

Run: `npm test`

Expected: all mission tests PASS.

- [x] **Step 5: Wire UI, renderer, controls, and floor/area readout**

In `src/main.js`, initialize `WebGLRenderer` with device pixel ratio capped at 2, append it to `#game-view`, construct the venue, controller, and mission, and resize renderer/camera from `ResizeObserver`. Render in `requestAnimationFrame` with clamped delta time. Preserve the existing crew cards, timer, objective count, mission log, reset/start/end modals, and supplied robot reference images. Update the area readout using room bounds and the robot's current Y level. Keep the controls keyboard-operable, expose status changes with `aria-live`, and allow free-roam completion to be restarted into a fresh timed run.

- [x] **Step 6: Remove the old flat-map script and markup**

Delete root `game.js` once its functions and UI behavior have been migrated. Remove old plan-overlay, robot-token, and map-specific markup from `index.html` and its CSS rules, retaining crew, mission, and modal elements used by the 3D interface.

- [x] **Step 7: Run tests and production build**

Run: `npm test`

Expected: all layout, collision, movement, and mission tests PASS.

Run: `npm run build`

Expected: Vite emits the full app bundle with no unresolved module or asset errors.

## Task 7: Document Assumptions and Verify the Playable Build

**Files:**
- Modify: `README.md`
- Modify: `github/ASSET-SOURCES.md` only if asset usage changed

- [x] **Step 1: Document install, run, build, and controls**

Update `README.md` to explain `npm install`, `npm run dev`, and `npm run build`; describe the timed mission, post-mission free roam, robot switching, movement, and activation controls. Record 1 unit = 1 m, 4.5 m floor separation, 3.6 m typical clear height, 4 m stair width, assumed door/corridor sizes, estimated material choices, plan alignment anchor, and the limitation that dimensions are not survey measurements. Identify the supplied plan assets used as references and disclose Three.js/Vite tooling.

- [x] **Step 2: Run the production build and unit suite**

Run: `npm test && npm run build`

Expected: all unit tests PASS and the production build exits 0.

- [x] **Step 3: Validate browser rendering at desktop and mobile sizes**

Run `npm run dev -- --host 127.0.0.1`, then use browser automation to capture the default desktop viewport and a 390 px-wide mobile viewport. Confirm the WebGL canvas is nonblank, no WebGL/runtime errors appear, the active robot and relevant level are framed, text/control panels do not overlap, and resize preserves the scene.

- [x] **Step 4: Validate end-to-end traversal and game flow**

In the browser, start a mission, move each robot through the actual doorway/corridor route to its objective, switch with 1/2/3, activate with E, verify the timer and completion feedback, then test free-roam movement. Specifically traverse from the exhibition hall up the grand stair into the foyer, enter at least one auditorium through its doorway, follow an aisle without seat collision, and return down to the ground floor. Confirm walls and seat banks block movement, door and corridor gaps pass, and the upper level cannot be reached by jumping through the slab. Restart and confirm mission state resets.

Expected: each required path is traversable, blocked boundaries hold, and the mission unlocks exploration only after all three objectives are complete.
