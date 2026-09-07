/** Small circle solver in fixed logical units; rendering never drives React state. */
export type GachaBody = { x: number; y: number; vx: number; vy: number; r: number; angle: number; spin: number; kickIn: number };
export function createGachaWorld(count = 24, seed = 83) {
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const width = 320;
  const height = 278;
  let stirringAge = 0;
  const bodies: GachaBody[] = Array.from({ length: count }, () => ({
    x: 48 + random() * 224, y: 40 + random() * 175,
    vx: 0, vy: 0, r: 21 + random() * 4,
    angle: random() * 1.2 - .6, spin: 0, kickIn: random() * .7,
  }));
  function constrain(b: GachaBody, bounce: number) {
    const wallRadius = 40;
    const inset = (y: number) => {
      const dy = y < wallRadius ? wallRadius - y : y > height - wallRadius ? y - (height - wallRadius) : 0;
      return dy ? wallRadius - Math.sqrt(Math.max(0, wallRadius * wallRadius - dy * dy)) : 0;
    };
    if (b.y > height - b.r) { b.y = height - b.r; if (b.vy > 0) b.vy = b.vy > 24 ? -b.vy * bounce : 0; b.vx *= .94; b.spin *= .9; }
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * bounce; }
    const edge = inset(b.y) + b.r;
    if (b.x < edge) { b.x = edge; b.vx = Math.abs(b.vx) * bounce; }
    if (b.x > width - edge) { b.x = width - edge; b.vx = -Math.abs(b.vx) * bounce; }
  }
  function step(dt: number, stirring = false) {
    stirringAge = stirring ? stirringAge + dt : 0;
    const bounce = stirring ? .72 : .18;
    for (const b of bodies) {
      if (stirring) {
        b.kickIn -= dt;
        // A coherent clockwise current reads as an intentional machine cycle,
        // rather than a collection of unrelated random jumps.
        const offsetX = (b.x - width * .5) / width;
        const offsetY = (b.y - height * .5) / height;
        const current = Math.sin(stirringAge * 4.4 + b.y * .026 + b.x * .011);
        const beat = Math.max(0, Math.sin(stirringAge * 7.1));
        b.vx += (offsetY * 235 + current * 72) * dt;
        b.vy += (-offsetX * 190 - (b.y > height * .58 ? 62 + beat * 74 : 0)) * dt;
      }
      if (stirring && b.kickIn <= 0) {
        b.kickIn = .24 + random() * .46;
        // A soft impeller lifts the lower layer. Smaller, offset pulses keep the
        // chamber lively without making every capsule explode at once.
        if (b.y > height * .6) {
          const ramp = Math.min(1, stirringAge / .5);
          const pulse = (.8 + .34 * Math.max(0, Math.sin(stirringAge * 4.7))) * ramp;
          b.vy -= (335 + random() * 205) * pulse;
          b.vx += Math.cos(stirringAge * 4.1 + b.y * .018) * 88 + (random() - .5) * 205;
          b.spin += (random() - .5) * 8;
        }
      }
      b.vy = Math.min(700, b.vy + (stirring ? 1010 : 1250) * dt);
      b.vx = Math.max(-480, Math.min(480, b.vx)) * Math.exp(-.7 * dt);
      b.vy = Math.max(-680, b.vy);
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.angle += b.spin * dt; b.spin *= Math.exp(-2 * dt);
    }
    // Three passes are enough during fast motion; use a few more only while the
    // pile is settling, when overlap is actually visible.
    const collisionPasses = stirring ? 2 : 6;
    for (let pass = 0; pass < collisionPasses; pass++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const overlap = a.r + b.r - distance;
        if (overlap <= 0) continue;
        const nx = distance > .0001 ? dx / distance : 1;
        const ny = distance > .0001 ? dy / distance : 0;
        const ratio = b.r * b.r / (a.r * a.r + b.r * b.r);
        a.x -= nx * overlap * ratio; a.y -= ny * overlap * ratio;
        b.x += nx * overlap * (1 - ratio); b.y += ny * overlap * (1 - ratio);
        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relative < 0) {
          const impulse = -(1 + bounce) * relative;
          a.vx -= impulse * nx * ratio; a.vy -= impulse * ny * ratio;
          b.vx += impulse * nx * (1 - ratio); b.vy += impulse * ny * (1 - ratio);
          if (!stirring) { a.vx *= .96; b.vx *= .96; }
        }
      }
      bodies.forEach((b) => constrain(b, bounce));
    }
  }
  // Pre-settle the initial pile offscreen: no grid, no floating placeholders.
  for (let i = 0; i < 500; i++) step(1 / 120);
  bodies.forEach((b) => { b.vx = 0; b.vy = 0; });
  return { width, height, bodies, step };
}
