Prompts:

## Original Environment Prompt

> I forgot to initially give this prompt can you do it: Use the attached cinema floor plans to create a 3D environment for a robot exploration game. They are two levels of one building: the exhibition hall on the ground floor and the auditoriums on the first floor. Stack them, and connect them with the grand staircase that lands in the foyer. Preserve the relative placement of the auditoriums, corridors and entrances. Use the visible seating layouts and room connections as a guide. Add collision boundaries so the robot walks through doorways and corridors, and can climb between the levels. Where heights, materials or dimensions are not specified, make consistent assumptions and list them.

## Gameplay Follow-Up

The selected direction was to blend both modes: retain the timed three-robot mission, then unlock untimed free exploration after all objectives are complete.

## Consolidated Implementation Brief

This is a restatement of the approved request and design decisions for implementation, not a separate image-generation prompt:

```text
Use the repository's supplied Kinepolis exhibition-floor and cinema-level plans to build one walkable Three.js environment. Keep the exhibition hall on the ground floor and place the auditoriums and concourse above it. Anchor the floor alignment at the grand staircase: its lower landing opens into the exhibition hall and its upper landing arrives in the foyer. Preserve relative room placement, auditorium order/orientation, entrances, corridors, and visible seating layouts. Model actual doorway and aisle gaps, block walls and seat banks, and let robots climb the stair using a continuous ramp collider beneath visible steps. Keep the existing timed Voxxy/Droid/Biggy objectives, then allow free exploration after completion. Use consistent estimates for unspecified dimensions and materials, and document those estimates as approximate rather than surveyed.
```

## Prompt and Modeling Notes

- No separate text-to-image or mesh-generation prompt was used. Venue geometry, seating, doors, stair treads, and materials are constructed procedurally with Three.js from local plan references.
- GitHub Copilot assisted with the layout data, scene code, collision logic, tests, and documentation.
- Iterations added wall gaps at doorways, including the side entrance and BOF connector; separate walkable regions for each floor; matching openings in both floor slabs around the stair shaft; and four seating blocks per auditorium to preserve center aisles and cross-aisles.
- Browser checks exposed and corrected mobile grid overflow, Enter-key interception on focused buttons, stair elevation shortcuts, and the completion modal reopening during free roam.
- Dimensions, plan alignment, room extents, and material finishes remain hand-reviewed modeling assumptions rather than measurements of the venue.