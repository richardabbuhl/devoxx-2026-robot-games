const STEP_UP_TOLERANCE = 0.75;
const RAMP_STEP_TOLERANCE = 0.2;
const EPSILON = 1e-9;

function overlapsAtHeight(position, height, collider) {
  if (collider.minY === undefined || collider.maxY === undefined) return true;
  return position.y + height > collider.minY && position.y < collider.maxY;
}

function overlapsOnAxis(position, radius, collider, axis) {
  const min = axis === 'x' ? collider.minX : collider.minZ;
  const max = axis === 'x' ? collider.maxX : collider.maxZ;
  return position[axis] + radius > min && position[axis] - radius < max;
}

function resolveAxis(position, delta, radius, height, colliders, axis) {
  const movement = delta[axis] ?? 0;
  if (movement === 0) return position[axis];
  const candidate = { ...position, [axis]: position[axis] + movement };
  for (const collider of colliders) {
    if (!overlapsAtHeight(position, height, collider)
      || !overlapsOnAxis(position, radius, collider, axis === 'x' ? 'z' : 'x')) continue;
    const minimum = axis === 'x' ? collider.minX : collider.minZ;
    const maximum = axis === 'x' ? collider.maxX : collider.maxZ;
    if (movement > 0 && position[axis] + radius <= minimum && candidate[axis] + radius > minimum) {
      candidate[axis] = Math.min(candidate[axis], minimum - radius);
    } else if (movement < 0 && position[axis] - radius >= maximum && candidate[axis] - radius < maximum) {
      candidate[axis] = Math.max(candidate[axis], maximum + radius);
    }
  }
  return candidate[axis];
}

export function resolveMovement(position, delta, radius, height, colliders = []) {
  const next = { ...position };
  next.x = resolveAxis(next, delta, radius, height, colliders, 'x');
  next.z = resolveAxis(next, delta, radius, height, colliders, 'z');
  return { x: next.x, z: next.z };
}

export function stairHeightAt(x, z, stair, radius = 0) {
  const dx = stair.upper.x - stair.lower.x;
  const dz = stair.upper.z - stair.lower.z;
  const horizontalLengthSquared = dx * dx + dz * dz;
  if (horizontalLengthSquared <= EPSILON) return null;
  const offsetX = x - stair.lower.x;
  const offsetZ = z - stair.lower.z;
  const progress = (offsetX * dx + offsetZ * dz) / horizontalLengthSquared;
  if (progress < 0 || progress > 1) return null;
  const lateralDistance = Math.abs(offsetX * dz - offsetZ * dx) / Math.sqrt(horizontalLengthSquared);
  if (lateralDistance > stair.width / 2 + radius) return null;
  return stair.lower.y + (stair.upper.y - stair.lower.y) * progress;
}

export function floorHeightAt(x, z, layout, currentY) {
  for (const stair of layout.stairs ?? []) {
    const stairHeight = stairHeightAt(x, z, stair, 0);
    if (stairHeight !== null && Math.abs(stairHeight - currentY) <= RAMP_STEP_TOLERANCE) return stairHeight;
  }
  let closestHeight = null;
  let closestDistance = Infinity;
  for (const level of Object.values(layout.levels)) {
    const isWalkable = (level.walkableAreas ?? [level.bounds]).some((area) => (
      x >= area.minX && x <= area.maxX && z >= area.minZ && z <= area.maxZ
    ));
    const distance = Math.abs(level.elevation - currentY);
    if (isWalkable && distance <= STEP_UP_TOLERANCE && distance < closestDistance) {
      closestHeight = level.elevation;
      closestDistance = distance;
    }
  }
  return closestHeight;
}
