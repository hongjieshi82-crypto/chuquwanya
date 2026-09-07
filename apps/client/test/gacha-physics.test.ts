import assert from 'node:assert/strict';
import test from 'node:test';
import { createGachaWorld } from '../src/lib/gacha-physics';

function assertContained(world: ReturnType<typeof createGachaWorld>) {
  for (const b of world.bodies) {
    assert.ok([b.x,b.y,b.vx,b.vy,b.angle].every(Number.isFinite));
    assert.ok(b.x >= b.r - .01 && b.x <= world.width - b.r + .01);
    assert.ok(b.y >= b.r - .01 && b.y <= world.height - b.r + .01);
  }
}

test('balls settle into a supported pile with no visible interpenetration', () => {
  const w = createGachaWorld();
  assertContained(w);
  for (const [i,a] of w.bodies.entries()) {
    const supported = a.y + a.r >= w.height - 2 || w.bodies.some(b => b !== a && b.y > a.y && Math.hypot(a.x-b.x,a.y-b.y) <= a.r+b.r+2);
    assert.ok(supported, `ball ${i} is floating`);
    for (const b of w.bodies.slice(i+1)) assert.ok(a.r+b.r-Math.hypot(a.x-b.x,a.y-b.y) < 1.5);
  }
});

test('stirring lifts and scatters balls; stopping restores a stable bottom pile', () => {
  const w = createGachaWorld();
  let highest = w.height;
  for (let i=0;i<480;i++) {
    w.step(1/120,true); assertContained(w);
    highest = Math.min(highest,...w.bodies.map(b=>b.y));
  }
  assert.ok(highest < w.height*.3, 'balls should reach upper chamber');
  for (let i=0;i<600;i++) w.step(1/120);
  assertContained(w);
  assert.ok(w.bodies.reduce((sum,b)=>sum+b.y,0)/w.bodies.length > w.height*.65);
  assert.ok(Math.max(...w.bodies.map(b=>Math.hypot(b.vx,b.vy))) < 25);
});

test('different initial seeds remain contained during a long draw', () => {
  for (const seed of [1,12,99]) {
    const w = createGachaWorld(24,seed);
    for(let i=0;i<900;i++) { w.step(1/120,true); assertContained(w); }
  }
});
