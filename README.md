# After Hours: Cinema Circuit

A Three.js exploration game set across the exhibition hall and cinema level at Kinepolis Antwerp. Wake three venue systems during the timed mission, then continue exploring the two connected floors.

## Play

The quickest setup uses Node.js 20.19+ or 22.12+:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production bundle; `npm run preview` serves it locally. Run `npm test` for the layout, collision, movement, scene, and mission suites.

### Run without `npm install`

The game can also run directly as browser-native ES modules. The HTML file maps Three.js to the pinned jsDelivr URL, so no npm packages are needed for runtime. From the repository root, start any static file server, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. This requires the browser or work network to allow `cdn.jsdelivr.net`. For an offline or locked-down environment, download `three.module.js` from the same URL into `vendor/three.module.js`, change the import-map value to `./vendor/three.module.js`, and serve the repository with the same command. Opening `index.html` with `file://` is not supported reliably because browsers restrict module and asset loading from local files.

## Controls

- Move: `WASD` or arrow keys; the on-screen directional pad is available on narrow touch layouts.
- Switch specialists: `1`, `2`, `3`, or select a crew member.
- Activate a nearby assigned objective: `E` or `Enter`.
- Restart a shift: the restart button in the status bar.

Voxxy is the orange, bear-eared scout: its exhibition scan lights a cyan guidance trail through the grand stair to the cinema level. Droid is the tall, weathered dark repair unit: it restores the Auditorium 03 projector with three activation pulses, powering its screen. Biggy is the blue-helmeted, orange-bellied heavy unit: build speed, then activate the grand stair gate while moving to bring up the foyer lights.

The three systems can be completed in any order. Each completion stores opening-sequence energy; following the circuit `Biggy -> Voxxy -> Droid` creates a 40-point chain surge at every link, while other orders remain possible but earn less. Finish all three before time expires to unlock untimed exploration. A timed-out shift can be restarted.

## Environment Assumptions

The exhibition hall is on the ground floor at Y = 0 m; the auditorium/concourse floor is 4.5 m above it. The world scale is 1 scene unit per metre. Dimensions are approximate modeling estimates traced from the supplied drawings, not a venue survey.

- Typical clear room height: 3.6 m; the exhibition hall is modeled as a taller open volume.
- Grand staircase: 4 m wide, 8.5 m horizontal run, 4.5 m rise; visible steps sit above a continuous ramp used for robot traversal.
- Public double-door openings: approximately 1.8 m wide and 2.2 m high; wider hall connections follow the plan proportions.
- Main circulation routes are modeled at least 2 m clear where the plans do not specify dimensions.
- Auditorium seating uses 0.65 m side aisles and 1.1 m center and cross-aisles; seat banks are split around those routes.
- Robot collision body: approximately 0.55 m wide and 0.8 m tall.
- Public circulation uses polished stone/terrazzo; auditoriums use dark carpet and acoustic wall finishes; general walls are pale plaster/concrete; stair treads use stone/concrete with metal rails.
- The stair/foyer connection is the vertical alignment anchor. Room proportions and relative locations follow the plan images; exact building scale and finishes remain estimates.

## References and Tools

Venue layout references: `github/assets/maps/exhibition-floor.jpg`, `hollywood-area.png`, `cinema-venue-devoxx.png`, and `devoxx-rooms.jpg`. Robot crew references are the local files in `github/assets/robots/`. Plan images are references only, not playable floor textures. Venue photos are not used as runtime assets; retain the licensing notes in [`github/ASSET-SOURCES.md`](github/ASSET-SOURCES.md).

The browser game uses JavaScript ES modules, Three.js, and Vite. GitHub Copilot assisted with the procedural geometry, collision model, and tests. Iterations added explicit wall gaps at doors, split auditorium seating around aisles, floor-specific walkable regions, and a ramp-aligned stair after testing exposed route and collision edge cases. The plan-derived geometry and all dimensions were reviewed and adjusted by hand; measurements should not be treated as surveyed.

See [`GAME-INSTRUCTIONS.md`](GAME-INSTRUCTIONS.md) for the competition brief and constraints.
See [`docs/superpowers/specs/2026-09-30-Prompts.md`](docs/superpowers/specs/2026-09-30-Prompts.md) for the original environment prompt, gameplay direction, and modeling iterations.
