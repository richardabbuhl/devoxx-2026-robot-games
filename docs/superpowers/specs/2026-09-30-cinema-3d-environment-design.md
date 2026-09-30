# Cinema 3D Environment Design

Date: 2026-09-30

## Summary

Replace the current flat map playfield with a continuous, walkable 3D representation of the Kinepolis venue. The exhibition hall occupies the ground floor; the auditorium level sits above it. A grand staircase connects the exhibition hall to the foyer on the auditorium level. Preserve the relative placement, room connections, entrances, corridors, and visible seating patterns in the supplied floor plans.

Retain the existing timed three-robot mission, then unlock untimed free exploration on completion. The environment and traversal are the feature; the existing crew panel and mission feedback remain useful parts of the game interface.

## Current Project

The game is a dependency-free HTML/CSS/JavaScript application. `game.js` represents robots as 2D percentage coordinates over a single plan image; movement clamps to the playfield edges and has no walls, doors, elevation, or collision. The repository already contains the reference plans:

- `github/assets/maps/exhibition-floor.jpg` and `github/assets/maps/hollywood-area.png` for the ground-floor exhibition area.
- `github/assets/maps/cinema-venue-devoxx.png` and `github/assets/maps/devoxx-rooms.jpg` for the cinema/auditorium level and Devoxx room annotations.

The plan images are modeling references, not textures in the finished scene.

## User Experience

- Show the active robot in a third-person follow-camera view of the building. Keep the crew selection, objective status, timer, and concise mission feedback from the current interface.
- Move with WASD or arrow keys, switch with 1/2/3, and activate the selected robot's objective with E or Enter.
- Retain each robot's distinct movement speed and its existing specialist objective. Put objectives in their corresponding areas across both floors.
- Give the timed mission enough time for the longer 3D routes; tune the timer after the scene scale and walking speeds are implemented rather than assuming the current 90 seconds remains fair.
- Completing all three objectives ends the timer and unlocks free exploration. Restart returns to the timed mission.
- Show a clear current-floor/area readout so the player understands vertical movement.

## Environment Layout

Build both floors in one world coordinate system. Trace room footprints, entrances, corridors, foyer and stair footprint from the plans. Use the common stair/foyer connection as the alignment anchor when positioning the two plan-derived layouts. Preserve the original relative arrangement and adjacency rather than arranging rooms for visual symmetry.

The ground floor includes the exhibition hall, its visible entrances and connected public areas. The first floor includes every auditorium and room connection legible in the supplied plan, the shared circulation corridor, and the foyer. Arrange auditorium seating in rows that follow each visible seating layout and orientation; leave the indicated entrance, side aisle, and cross-aisle routes open. Build wall geometry as segments around openings so doors connect to actual walkable corridors.

The grand staircase is wide and prominent. Its lower landing opens into the exhibition hall and its upper landing terminates in the foyer, not inside an auditorium. Render individual steps and handrails, with a continuous hidden ramp collider following the stair incline so robot movement can climb it reliably.

## Technical Design

Use Three.js for rendering and hand-authored procedural meshes for floors, wall segments, doors, seating, stairs, architectural accents, lighting, and robot placeholders. Keep scene construction and venue layout data separate from mission/UI state. The layout data should define room bounds, wall segments/openings, seating banks, stair bounds and landings, floor elevations, entrances, and objective positions in meters. Use that same data to build visible geometry and static collision shapes so visible routes and collision routes cannot drift apart.

Use a capsule-like robot collider with horizontal movement, floor contact, and elevation sampled from the ground surface or stair ramp. Resolve movement against static wall and seating colliders; do not collide the player with decorative trim or handrails. Open doorways and aisles must be gaps in collision geometry, not visual-only openings. The upper floor is reachable only through the connected stair route during normal play.

Adopt a small npm/Vite setup to serve and bundle the Three.js application. This changes the current `open index.html` workflow to documented npm install and dev/build commands. Do not require external runtime asset downloads; keep the scene materials and game logic local. Reuse the supplied robot images in the crew UI while the in-world robots remain simple original geometric representations unless suitable models already exist.

## Visual Direction and Assumptions

These are explicit working assumptions where the source plans do not specify measurements or construction details:

- World scale: 1 Three.js unit equals 1 metre.
- Ground-floor finished floor: Y = 0 m.
- First-floor finished floor: Y = 4.5 m above ground.
- Typical clear room height: 3.6 m. The exhibition hall may use a taller open volume where the plans and stair connection support it.
- Grand staircase: approximately 4 m wide with about 4.5 m total rise; visible step geometry overlays a continuous walkable ramp collider.
- Double-door openings: approximately 1.8 m wide and 2.2 m high, adjusted to the actual plan connections. Main corridors should provide at least 2 m clear width where the plan is ambiguous.
- Robot collider: approximately 0.8 m tall and 0.55 m wide, scaled consistently for all three robots; robot speed remains character-specific.
- Materials: terrazzo or polished stone for public foyers and exhibition circulation; carpeted floors and dark acoustic wall finishes in auditoriums; pale concrete/plaster for general walls; stone/concrete stair treads with metal or wood handrails. These are visual estimates, not claims about measured venue finishes.
- Where plan scale or architectural height is unavailable, preserve ratios and connections from the drawings and use the assumptions above rather than implying survey accuracy.

Record the dimensions, floor alignment method, material estimates, references, and any manual corrections in the repository's documentation when implementation is complete.

## Scope Boundaries

- Do not model the venue as an exact architectural survey or claim accurate measurements.
- Do not reproduce the floor-plan images as flat playable floors.
- Do not add unrelated game systems, new story beats, or imported 3D model pipelines.
- Do not remove the three-robot mission; free exploration is the post-mission state.

## Validation Criteria

- The scene renders without a blank canvas at desktop and mobile viewport sizes, with the robot and both stacked levels readable.
- The exhibition hall, auditorium placement, entrances, corridors, room connections, seating orientation, and stair/foyer relationship visibly follow the supplied plans.
- The player cannot pass through walls or seating banks, can traverse open doorways and corridors, and can walk up the grand staircase to the first-floor foyer and back down.
- The upper floor cannot be reached by walking through empty space or clipping through the slab.
- Each robot can reach and activate its own objective; completing the timed mission unlocks free exploration.
- Controls, floor/area feedback, installation, and run/build steps are documented and usable by a first-time player.
