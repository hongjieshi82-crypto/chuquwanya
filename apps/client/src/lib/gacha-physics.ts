/** Shallow 3D sphere solver in fixed logical units; rendering never drives React state. */
export type GachaBody = { x: number; y: number; z: number; vx: number; vy: number; vz: number; r: number; angle: number; spin: number; phase: number };

// Pre-settled once with this solver. Reusing the stable pile avoids thousands
// of synchronous collision checks while the mobile result page is opening.
const settledPile = [
  [237.201,252.659,86.659,25.341,-.927,4.277],[79.388,250.344,84.344,27.656,1.972,1.261],[186.881,251.902,26.098,26.098,.064,1.251],[290.306,250.218,84.218,27.782,2.01,5.638],
  [132.568,252.371,86.371,25.629,-2.138,4.561],[292.596,253.886,24.114,24.114,-1.055,.085],[236.979,253.914,24.086,24.086,-.056,4.648],[81.707,251.361,26.639,26.639,.401,2.193],
  [293.942,196.535,85.939,26.058,.118,3.94],[134.629,251.185,33.998,26.815,-.658,4.031],[27.705,253.363,77.283,24.637,-2.096,4.67],[184.798,251.369,85.369,26.631,-.105,3.961],
  [213.231,219.269,55.931,25.475,.268,2.993],[109.953,204.35,81.354,27.671,-.618,.742],[161.488,206.621,25.854,25.854,1.362,1.942],[242.968,192.32,86.824,25.176,.383,.207],
  [204.559,173.189,28.742,28.742,-.191,5.537],[164.555,201.669,84.891,27.109,-.091,3.092],[108.308,204.977,26.857,26.857,-2.595,.331],[54.508,206.5,42.589,28.212,1.135,5.424],
  [264.805,218.641,47.846,26.734,1.896,6.063],[24.073,205.971,87.927,24.073,-2.628,5.203],[200.794,160.457,83.668,27.781,.396,.659],[137.208,161.726,25.188,25.188,-2.189,2.788],
  [28.748,251.655,26.345,26.345,-1.947,2.301],[136.038,157.7,76.227,26.022,1.021,1.296],[174.838,128.859,24.776,24.776,2.203,.706],[167.749,120.724,87.927,24.073,-1.28,.706],
  [64.484,177.311,86.516,25.484,-1.999,1.504],[28.932,156.126,51.222,28.932,-1.097,4.539],[78.655,162.467,25.008,25.008,2.596,1.493],[129.081,115.366,46.187,26.348,-.048,1.4],
  [291.927,175.324,28.073,28.073,3.202,1.6],[90.445,131.4,84.709,27.291,-2.593,3.067],[80.011,110.846,26.658,26.658,.962,.994],[249.409,152.098,54.256,27.012,1.561,.906],
] as const;

export function createGachaWorld(count = 36, seed = 83) {
  const width = 320;
  const height = 278;
  const depth = 112;
  let stirringAge = 0;
  let motor = 0;
  const bodies: GachaBody[] = settledPile.slice(0, count).map(([x,y,z,r,angle,phase]) => ({
    x: seed % 2 ? x : width - x, y, z, r, angle, phase: phase + seed * .017,
    vx: 0, vy: 0, vz: 0, spin: 0,
  }));
  function constrain(b: GachaBody, bounce: number) {
    if (b.z < b.r) { b.z = b.r; b.vz = Math.abs(b.vz) * bounce; }
    if (b.z > depth - b.r) { b.z = depth - b.r; b.vz = -Math.abs(b.vz) * bounce; }
    const wallRadius = 40;
    const inset = (y: number) => {
      const dy = y < wallRadius ? wallRadius - y : y > height - wallRadius ? y - (height - wallRadius) : 0;
      return dy ? wallRadius - Math.sqrt(Math.max(0, wallRadius * wallRadius - dy * dy)) : 0;
    };
    if (b.y > height - b.r) { b.y = height - b.r; if (b.vy > 0) b.vy = b.vy > 24 ? -b.vy * bounce : 0; b.vx *= .94; b.vz *= .94; b.spin *= .9; }
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * bounce; }
    const edge = inset(b.y) + b.r;
    if (b.x < edge) { b.x = edge; b.vx = Math.abs(b.vx) * bounce; }
    if (b.x > width - edge) { b.x = width - edge; b.vx = -Math.abs(b.vx) * bounce; }
  }
  function step(dt: number, stirring = false) {
    motor = stirring ? Math.min(1, motor + dt / .2) : Math.max(0, motor - dt / .48);
    stirringAge = motor > 0 ? stirringAge + dt : 0;
    const bounce = .18 + motor * .25;
    for (const b of bodies) {
      if (motor > 0) {
        // A hidden paddle sweeps beneath the pile. Each narrow beat strikes a
        // local group; the rest of the motion is transferred by collisions.
        const bladeX = width * .5 + Math.sin(stirringAge * 3.7) * width * .31;
        const beat = Math.max(0, Math.sin(stirringAge * 7.8));
        const accent = .82 + .42 * Math.max(0, Math.sin(stirringAge * 2.55)) ** 6;
        const strike = beat ** 8 * accent;
        const low = Math.max(0, Math.min(1, (b.y - height * .58) / (height * .3)));
        const dx = b.x - bladeX;
        const contact = Math.exp(-(dx * dx) / 4_600) * low * strike;
        const cabinetVibration = Math.sin(stirringAge * 11.6) * 105;
        b.vy -= 29_000 * contact * motor * dt;
        b.vx += (Math.sign(dx || 1) * 1_850 * contact + cabinetVibration) * motor * dt;
        b.vz += Math.sin(stirringAge * 4.3 + b.phase) * 340 * contact * motor * dt;
      }
      b.vy = Math.min(700, b.vy + 1250 * dt);
      b.vx = Math.max(-430, Math.min(430, b.vx)) * Math.exp(-1.05 * dt);
      b.vy = Math.max(-680, b.vy);
      b.vz *= Math.exp(-1.55 * dt);
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      b.angle += b.spin * dt; b.spin *= Math.exp(-1.2 * dt);
    }
    // Extra collision passes keep the larger spheres separated; use a few more only while the
    // pile is settling, when overlap is actually visible.
    const collisionPasses = stirring ? 3 : 6;
    for (let pass = 0; pass < collisionPasses; pass++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const distance = Math.hypot(dx, dy, dz);
        const overlap = a.r + b.r - distance;
        if (overlap <= 0) continue;
        const nx = distance > .0001 ? dx / distance : 1;
        const ny = distance > .0001 ? dy / distance : 0;
        const nz = distance > .0001 ? dz / distance : 0;
        const ratio = b.r * b.r / (a.r * a.r + b.r * b.r);
        a.x -= nx * overlap * ratio; a.y -= ny * overlap * ratio; a.z -= nz * overlap * ratio;
        b.x += nx * overlap * (1 - ratio); b.y += ny * overlap * (1 - ratio); b.z += nz * overlap * (1 - ratio);
        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz;
        if (relative < 0) {
          const impulse = -(1 + bounce) * relative;
          a.vx -= impulse * nx * ratio; a.vy -= impulse * ny * ratio; a.vz -= impulse * nz * ratio;
          b.vx += impulse * nx * (1 - ratio); b.vy += impulse * ny * (1 - ratio); b.vz += impulse * nz * (1 - ratio);
          // Friction at the contact point turns both spheres as they tumble.
          const tx = -ny, ty = nx;
          const slip = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - a.spin * a.r - b.spin * b.r;
          const friction = Math.max(-impulse * .16, Math.min(impulse * .16, -slip / 3));
          a.vx -= friction * tx * ratio; a.vy -= friction * ty * ratio;
          b.vx += friction * tx * (1 - ratio); b.vy += friction * ty * (1 - ratio);
          a.spin -= 2 * friction * ratio / a.r;
          b.spin -= 2 * friction * (1 - ratio) / b.r;
          if (!stirring) { a.vx *= .96; b.vx *= .96; }
        }
      }
      bodies.forEach((b) => constrain(b, bounce));
    }
  }
  return { width, height, depth, bodies, step };
}

/** Perspective is floor-aligned, so rear spheres remain inside the chamber. */
export function projectGachaBody(b: GachaBody, world: { width: number; height: number; depth: number }) {
  const scale = .88 + .12 * b.z / world.depth;
  return { x: world.width / 2 + (b.x - world.width / 2) * scale,
    y: world.height - (world.height - b.y) * scale, r: b.r * scale,
    layer: Math.round(b.z * 10), brightness: .83 + .17 * b.z / world.depth };
}
