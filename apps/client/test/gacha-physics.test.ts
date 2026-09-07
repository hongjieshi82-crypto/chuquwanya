import assert from 'node:assert/strict';
import test from 'node:test';
import { createGachaWorld, projectGachaBody } from '../src/lib/gacha-physics';

function assertContained(world: ReturnType<typeof createGachaWorld>) {
  for (const b of world.bodies) {
    assert.ok([b.x,b.y,b.z,b.vx,b.vy,b.vz,b.angle].every(Number.isFinite));
    assert.ok(b.x >= b.r - .01 && b.x <= world.width - b.r + .01);
    assert.ok(b.z >= b.r - .01 && b.z <= world.depth - b.r + .01);
    assert.ok(b.y >= b.r - .01 && b.y <= world.height - b.r + .01);
  }
}

test('balls settle into a supported pile with no visible interpenetration', () => {
  const w = createGachaWorld();
  assertContained(w);
  for (const [i,a] of w.bodies.entries()) {
    const supported = a.y + a.r >= w.height - 2 || w.bodies.some(b => b !== a && b.y > a.y && Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z) <= a.r+b.r+2);
    assert.ok(supported, `ball ${i} is floating`);
    for (const b of w.bodies.slice(i+1)) assert.ok(a.r+b.r-Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z) < 1.5);
  }
});

test('stirring lifts and scatters balls; stopping restores a stable bottom pile', () => {
  const w = createGachaWorld(36);
  const restingMean = w.bodies.reduce((sum,b)=>sum+b.y,0)/w.bodies.length;
  let highest = w.height;
  for (let i=0;i<480;i++) {
    w.step(1/120,true); assertContained(w);
    highest = Math.min(highest,...w.bodies.map(b=>b.y));
  }
  assert.ok(highest < w.height*.3, 'balls should reach upper chamber');
  for (let i=0;i<600;i++) w.step(1/120);
  assertContained(w);
  assert.ok(w.bodies.reduce((sum,b)=>sum+b.y,0)/w.bodies.length > restingMean - 8);
  assert.ok(Math.max(...w.bodies.map(b=>Math.hypot(b.vx,b.vy,b.vz))) < 25);
});

test('different initial seeds remain contained during a long draw', () => {
  for (const seed of [1,12,99]) {
    const w = createGachaWorld(36,seed);
    for(let i=0;i<900;i++) { w.step(1/120,true); assertContained(w); }
  }
});


test('the resting pile leaves headroom and has real foreground occlusion', () => {
  const w = createGachaWorld(36);
  const projected = w.bodies.map(b => projectGachaBody(b, w));
  assert.ok(Math.min(...projected.map(b => b.y - b.r)) > w.height * .25);
  assert.ok(projected.some((a,i) => projected.slice(i+1).some(b =>
    Math.abs(a.layer-b.layer) > 100 && a.r+b.r-Math.hypot(a.x-b.x,a.y-b.y) > 5)));
});
