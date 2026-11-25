// Entry point: canvas sizing, input, the fixed render order and the screenshot staging used
// by the capture script. The simulation never imports from here.

import { W, H, SHOT, LINE, GRILL, MENU, SHIFT } from './config.js';
import { newState, update, startShift, stationAt } from './game.js';
import { emberField } from './art.js';
import {
  drawRoom, drawCounter, drawCrates, drawBoard, drawGrill, drawPass, drawServeWindow, drawForeground,
} from './kitchen.js';
import { drawChef } from './art.js';
import { drawHud, drawTitle, drawSummary } from './hud.js';
import { sfx, unlock, setMuted, isMuted } from './sfx.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = W;
canvas.height = H;

function fit() {
  if (SHOT) {
    // capture frames are always exactly 1280x720, edge to edge
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    return;
  }
  const pad = 16;
  const availW = Math.max(320, window.innerWidth - pad);
  const availH = Math.max(240, window.innerHeight - pad);
  const scale = Math.min(availW / W, availH / H);
  canvas.style.width = `${Math.round(W * scale)}px`;
  canvas.style.height = `${Math.round(H * scale)}px`;
}
window.addEventListener('resize', fit);
fit();

/* ---------------------------------- input ---------------------------------- */

const keys = new Set();
const edges = { interact: false, confirm: false, pick: null, dump: false };

const PICK_KEYS = { '1': 'bun', '2': 'patty', '3': 'cheese', '4': 'lettuce', '5': 'tomato', '6': 'onion' };

addEventListener('keydown', (e) => {
  unlock();
  const k = e.key.toLowerCase();
  if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  if (keys.has(k)) return;
  keys.add(k);
  if (k === 'e' || k === ' ') edges.interact = true;
  if (k === 'enter') edges.confirm = true;
  if (k === 'q') edges.dump = true;
  if (PICK_KEYS[k]) edges.pick = PICK_KEYS[k];
  if (k === 'm') setMuted(!isMuted());
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

// Touch / mouse: walk toward the tapped station and act when close enough.
const pointer = { x: null };
canvas.addEventListener('pointerdown', (e) => {
  unlock();
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * W;
  pointer.x = x;
  if (state.mode === 'title' || state.mode === 'summary') edges.confirm = true;
  else if (Math.abs(x - state.chef.x) < 90) edges.interact = true;
});

/* ---------------------------------- state ---------------------------------- */

const state = newState();

function readInput() {
  const input = {
    left: keys.has('a') || keys.has('arrowleft'),
    right: keys.has('d') || keys.has('arrowright'),
    interact: edges.interact,
    confirm: edges.confirm,
    pick: edges.pick,
    dump: edges.dump,
  };
  if (pointer.x !== null && state.mode === 'play') {
    const dx = pointer.x - state.chef.x;
    if (Math.abs(dx) > 24) {
      input.left = dx < 0;
      input.right = dx > 0;
    } else {
      pointer.x = null;
      input.interact = true;
    }
  }
  edges.interact = false;
  edges.confirm = false;
  edges.pick = null;
  edges.dump = false;
  return input;
}

/* ---------------------------------- sound cues ---------------------------------- */

const seen = { served: 0, lost: 0, plate: 0, grill: 0, mode: state.mode };
function soundCues() {
  if (state.served > seen.served) sfx.cash();
  if (state.lost > seen.lost) sfx.fail();
  if (state.plate.length > seen.plate) sfx.plate();
  const filled = state.grill.filter(Boolean).length;
  if (filled > seen.grill) sfx.sizzle();
  if (state.mode === 'play' && seen.mode !== 'play') sfx.start();
  seen.served = state.served;
  seen.lost = state.lost;
  seen.plate = state.plate.length;
  seen.grill = filled;
  seen.mode = state.mode;
}

/* ---------------------------------- render ---------------------------------- */

function render(t) {
  ctx.save();
  if (state.shakeT > 0) {
    const s = state.shakeT * 14;
    ctx.translate(Math.sin(t * 90) * s, Math.cos(t * 77) * s * 0.6);
  }

  drawRoom(ctx, state.t, state);
  drawCounter(ctx);
  drawCrates(ctx, state.t, state.hover === 'crate');
  drawBoard(ctx, state.t, state.chop, state.hover === 'board');
  drawGrill(ctx, state.t, state.grill, state.hover === 'grill');
  drawPass(ctx, state.t, state.plate, state.hover === 'pass');
  drawServeWindow(ctx, state.t, state, state.hover === 'window');
  emberField(ctx, state.embers, state.t);

  if (state.mode !== 'title') {
    drawChef(ctx, {
      x: state.chef.x,
      y: state.chef.y,
      facing: state.chef.facing,
      walk: state.chef.walk,
      moving: state.chef.moving,
      carry: state.chef.carry,
      busy: state.chef.busy,
    }, state.t);
  }

  drawForeground(ctx, state.t);
  drawHud(ctx, state, state.t);
  if (state.mode === 'title') drawTitle(ctx, state, state.t);
  if (state.mode === 'summary') drawSummary(ctx, state, state.t);
  ctx.restore();
}

/* ---------------------------------- staging ---------------------------------- */

// `?shot=cover` freezes a composed frame for the capture script: no player needed, and the
// state is deterministic so re-running the capture produces the same picture.
function stage(name) {
  const ticket = (id, leftFrac) => {
    const recipe = MENU.find((r) => r.id === id) || MENU[0];
    const total = SHIFT.ticketTime;
    return { id: ++state.ticketId, recipe, left: total * leftFrac, total, hot: 0 };
  };

  if (name === 'title') {
    state.mode = 'title';
    return;
  }

  state.mode = 'play';
  state.t = 12.4;
  state.score = 148;
  state.tips = 26;
  state.served = 9;
  state.lost = 1;
  state.combo = 4;
  state.bestCombo = 4;
  state.shiftLeft = 96;
  state.servePulse = 0.8;

  if (name === 'cover') {
    state.tickets = [ticket('stack', 0.74), ticket('classic', 0.42)];
    state.plate = ['bun', 'patty', 'cheese', 'onion'];
    state.grill = [{ cook: 0.62 }, { cook: 0.24 }, null, { cook: 1.18, burned: false }];
    state.chef.x = LINE.passX - 40;
    state.chef.facing = 1;
    state.chef.carry = ['bun', 'cheese'];
    state.hover = 'pass';
    state.popups = [{ x: LINE.passX, y: LINE.y - 96, text: '+$19', life: 1.2, color: '#8fe07a' }];
  } else if (name === 'grill') {
    state.tickets = [ticket('double', 0.58), ticket('garden', 0.3)];
    state.plate = ['bun', 'patty'];
    state.grill = [{ cook: 0.38 }, { cook: 0.74 }, { cook: 1.02, burned: true }, { cook: 0.55 }];
    state.chef.x = GRILL.x - 10;
    state.chef.facing = 1;
    state.chef.carry = ['patty'];
    state.hover = 'grill';
    state.score = 96;
    state.combo = 3;
    state.popups = [{ x: GRILL.x, y: LINE.y - 80, text: 'sizzle', life: 1, color: '#ffb347' }];
  } else if (name === 'rush') {
    state.tickets = [ticket('double', 0.66), ticket('garden', 0.28), ticket('stack', 0.85)];
    state.plate = ['bun', 'patty', 'cheese'];
    state.grill = [{ cook: 0.7 }, { cook: 0.35 }, { cook: 1.1, burned: true }, { cook: 0.2 }];
    state.chef.x = LINE.passX + 26;
    state.chef.facing = -1;
    state.chef.carry = ['bun', 'cheese', 'patty'];
    state.hover = 'window';
    state.score = 231;
    state.combo = 6;
    state.bestCombo = 6;
    state.lost = 1;
    state.served = 13;
    state.shiftLeft = 42;
    state.popups = [
      { x: LINE.windowX, y: LINE.y - 104, text: '+$24', life: 1.1, color: '#8fe07a' },
      { x: LINE.windowX, y: LINE.y - 130, text: 'x6 combo', life: 1.1, color: '#ffb347' },
    ];
  } else if (name === 'summary') {
    state.mode = 'summary';
    state.score = 268;
    state.served = 17;
    state.lost = 2;
    state.combo = 7;
    state.bestCombo = 7;
    state.tips = 44;
  }
}

if (SHOT) stage(SHOT);

/* ---------------------------------- loop ---------------------------------- */

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!SHOT) update(state, dt, readInput());
  else {
    // staged frames still animate atmosphere, so steam and rain look alive in the capture
    state.t += dt;
    readInput();
  }
  soundCues();
  render(state.t);
  requestAnimationFrame(frame);
}
if (SHOT) {
  let f = 0;
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.t += dt;
    render(state.t);
    if (++f < 24) requestAnimationFrame(tick);
    else document.title = 'ready';
  };
  requestAnimationFrame(tick);
} else {
  requestAnimationFrame(frame);
}

// expose a little of the sim for the console and for the capture harness
window.__ember = { state, stage, startShift, update };


