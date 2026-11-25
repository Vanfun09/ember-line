// Game logic: the shift, the tickets, the chef, the grill timers and the till.
// Rendering lives in main.js so the simulation can be stepped without painting.

import {
  LINE, GRILL, INGREDIENTS, MENU, SHIFT, CARRY_MAX, CHOP_TIME, MOVE_SPEED, W, COLORS,
} from './config.js';

const CYCLE = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'onion'];

export const STATIONS = [
  { id: 'crate', x: LINE.crateX, label: 'PANTRY', hint: '1-6 grab' },
  { id: 'board', x: LINE.boardX, label: 'BOARD', hint: 'E chop' },
  { id: 'grill', x: LINE.grillX, label: 'GRILL', hint: 'E cook' },
  { id: 'pass', x: LINE.passX, label: 'PASS', hint: 'E plate' },
  { id: 'window', x: LINE.windowX, label: 'SERVE', hint: 'E serve' },
];

export function newState() {
  return {
    mode: 'title',
    t: 0,
    shiftLeft: SHIFT.seconds,
    tickets: [],
    plate: [],
    chopped: new Set(),
    cookMarks: new Map(),
    grill: [null, null, null, null],
    chef: { x: 300, y: LINE.y + 175, facing: 1, walk: 0, moving: false, carry: [], busy: 0 },
    chop: { item: null, progress: 0, active: false },
    score: 0,
    tips: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    spawnIn: 1.2,
    ticketId: 1,
    hover: null,
    popups: [],
    servePulse: 0,
    flash: 0,
    shakeT: 0,
    lastServed: null,
    embers: Array.from({ length: 26 }, (_, i) => ({
      x: GRILL.x - 130 + ((i * 53) % 260),
      y: LINE.counterTop - 30,
      r: 1.2 + (i % 3) * 0.9,
      speed: 0.25 + (i % 5) * 0.12,
      phase: (i * 0.137) % 1,
      color: i % 3 === 0 ? '#ffd166' : '#ff7a3d',
    })),
  };
}

export function startShift(state) {
  const fresh = newState();
  Object.assign(state, fresh, { mode: 'play' });
  state.tickets.push(makeTicket(state, 'classic'));
}

function makeTicket(state, recipeId) {
  const recipe = MENU.find((r) => r.id === recipeId) || MENU[0];
  return {
    id: state.ticketId++,
    recipe,
    left: SHIFT.ticketTime * (recipe.stack.length > 4 ? 1.15 : 1),
    total: SHIFT.ticketTime * (recipe.stack.length > 4 ? 1.15 : 1),
    hot: 0,
  };
}

function pickRecipe(state) {
  // Later in the shift the bigger stacks show up; the early orders stay simple.
  const progress = 1 - state.shiftLeft / SHIFT.seconds;
  const pool = progress < 0.2 ? ['classic', 'garden']
    : progress < 0.55 ? ['classic', 'garden', 'stack']
      : ['classic', 'garden', 'stack', 'double', 'double'];
  const open = state.tickets.map((o) => o.recipe.id);
  const choices = pool.filter((id) => open.filter((o) => o === id).length < 2);
  return choices[Math.floor(Math.random() * choices.length)] || 'classic';
}

export function stationAt(x) {
  let best = STATIONS[0];
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = Math.abs(s.x - x);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD < 96 ? best : null;
}

export function update(state, dt, input) {
  state.t += dt;
  state.servePulse = Math.max(0, state.servePulse - dt * 2);
  state.flash = Math.max(0, state.flash - dt * 3);
  state.shakeT = Math.max(0, state.shakeT - dt);

  if (state.mode === 'title') {
    if (input.confirm) startShift(state);
    return;
  }
  if (state.mode === 'summary') {
    if (input.confirm) startShift(state);
    return;
  }

  const chef = state.chef;
  // ---- movement along the line ----
  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;
  if (dir !== 0) {
    chef.x = Math.max(LINE.walkMin, Math.min(LINE.walkMax, chef.x + dir * MOVE_SPEED * dt));
    chef.facing = dir;
    chef.moving = true;
    chef.walk += dt;
  } else {
    chef.moving = false;
  }
  chef.busy = Math.max(0, chef.busy - dt);

  const station = stationAt(chef.x);
  state.hover = station ? station.id : null;

  // ---- chop timer ----
  if (state.chop.active) {
    state.chop.progress += dt / CHOP_TIME;
    chef.busy = 0.2;
    if (state.chop.progress >= 1) {
      const idx = chef.carry.findIndex((n) => INGREDIENTS[n].veg && !state.chopped.has(n));
      if (idx >= 0) {
        state.chopped.add(chef.carry[idx]);
        state.popups.push({ x: chef.x, y: LINE.y + 60, text: 'chopped!', life: 1, color: COLORS.good });
      }
      state.chop.active = false;
      state.chop.progress = 0;
      state.chop.item = chef.carry.find((n) => INGREDIENTS[n].veg) || null;
    }
  }

  // ---- pantry: number keys take an ingredient, but only at the crate ----
  if (input.pick && chef.carry.length < CARRY_MAX) {
    if (!station || station.id !== 'crate') {
      hint(state, chef, 'walk to the pantry');
    } else {
      chef.carry.push(input.pick);
      state.popups.push({ x: chef.x, y: LINE.y + 40, text: INGREDIENTS[input.pick].label, life: 0.7, color: COLORS.cream });
      state.chop.item = chef.carry.find((n) => INGREDIENTS[n].veg) || null;
    }
  }

  // ---- the interact key ----
  if (input.interact && station) {
    switch (station.id) {
      case 'board': {
        const veg = chef.carry.find((n) => INGREDIENTS[n].veg && !state.chopped.has(n));
        if (veg && !state.chop.active) {
          state.chop.active = true;
          state.chop.progress = 0;
          state.chop.item = veg;
        } else if (!veg) {
          hint(state, chef, chef.carry.some((n) => INGREDIENTS[n].veg) ? 'already chopped' : 'need veg to chop');
        }
        break;
      }
      case 'grill': {
        const carryingPatty = chef.carry.indexOf('patty');
        const free = state.grill.findIndex((s) => s === null);
        if (carryingPatty >= 0 && free >= 0) {
          chef.carry.splice(carryingPatty, 1);
          state.grill[free] = { cook: 0, burned: false };
          chef.busy = 0.25;
          state.popups.push({ x: GRILL.x + (free - 1.5) * GRILL.spacing, y: LINE.y - 70, text: 'sizzle', life: 0.8, color: COLORS.amber });
        } else {
          // take the nearest cooked patty
          let pick = -1;
          let bestD = Infinity;
          state.grill.forEach((s, i) => {
            if (!s) return;
            const d = Math.abs(GRILL.x + (i - 1.5) * GRILL.spacing - chef.x);
            if (s.cook > 0.18 && d < bestD) { bestD = d; pick = i; }
          });
          if (pick >= 0 && chef.carry.length < CARRY_MAX) {
            const slot = state.grill[pick];
            state.grill[pick] = null;
            chef.carry.push('patty');
            state.chopped.add('patty');
            state.cookMarks = state.cookMarks || new Map();
            state.cookMarks.set('patty', slot.cook);
            chef.busy = 0.2;
          } else if (free < 0) {
            hint(state, chef, 'grill full');
          }
        }
        break;
      }
      case 'pass': {
        if (chef.carry.length === 0) { hint(state, chef, 'hands empty'); break; }
        // assemble to spec: prefer whatever the top ticket wants next, so the player never
        // has to juggle hand order to build a stack correctly
        const head = state.tickets[0];
        const need = head ? head.recipe.stack[state.plate.length] : null;
        let idx = need ? chef.carry.indexOf(need) : 0;
        if (idx < 0) idx = 0;
        const item = chef.carry[idx];
        if (INGREDIENTS[item].veg && !state.chopped.has(item)) { hint(state, chef, 'chop it first'); break; }
        if (item === 'patty' && !state.cookMarks.has('patty')) { hint(state, chef, 'grill the patty first'); break; }
        chef.carry.splice(idx, 1);
        state.plate.push(item);
        chef.busy = 0.2;
        break;
      }
      case 'window': {
        if (state.plate.length === 0) { hint(state, chef, 'plate is empty'); break; }
        serve(state);
        break;
      }
      case 'crate':
        hint(state, chef, 'press 1-6');
        break;
      default: break;
    }
  }

  if (input.dump && chef.x > LINE.passX - 96) {
    if (state.plate.length) {
      state.plate = [];
      state.popups.push({ x: LINE.passX, y: LINE.y - 60, text: 'scrapped', life: 0.9, color: COLORS.bad });
    }
  }

  // ---- grill timers ----
  for (const slot of state.grill) {
    if (!slot) continue;
    slot.cook += dt / GRILL.cookTime;
    if (slot.cook > GRILL.burnTime / GRILL.cookTime) slot.burned = true;
    if (slot.cook > 1.75) slot.cook = 1.75;
  }

  // ---- tickets ----
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.tickets.length < SHIFT.maxTickets) {
    state.tickets.push(makeTicket(state, pickRecipe(state)));
    state.spawnIn = SHIFT.spawnEvery;
  }
  for (let i = state.tickets.length - 1; i >= 0; i--) {
    const o = state.tickets[i];
    o.left -= dt;
    o.hot = Math.max(0, o.hot - dt * 2);
    if (o.left <= 0) {
      state.tickets.splice(i, 1);
      state.lost += 1;
      state.combo = 0;
      state.flash = 1;
      state.shakeT = 0.3;
      state.popups.push({ x: W / 2, y: 250, text: 'walked out', life: 1.2, color: COLORS.bad });
    }
  }

  // ---- shift clock ----
  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.mode = 'summary';
  }

  // ---- popups ----
  for (let i = state.popups.length - 1; i >= 0; i--) {
    const p = state.popups[i];
    p.life -= dt;
    p.y -= dt * 26;
    if (p.life <= 0) state.popups.splice(i, 1);
  }
}

function hint(state, chef, msg) {
  state.popups.push({ x: chef.x, y: LINE.y + 26, text: msg, life: 0.9, color: COLORS.bad });
}

function serve(state) {
  const plate = state.plate;
  const match = state.tickets.find((o) => sameStack(o.recipe.stack, plate));
  if (!match) {
    state.lost += 1;
    state.combo = 0;
    state.plate = [];
    state.flash = 1;
    state.shakeT = 0.35;
    state.popups.push({ x: LINE.windowX, y: LINE.y - 110, text: 'wrong order', life: 1.2, color: COLORS.bad });
    return;
  }
  state.tickets.splice(state.tickets.indexOf(match), 1);
  const speedBonus = match.left / match.total > 0.55 ? 2 : 0;
  const tip = Math.max(1, Math.round(2 + state.combo * 0.6 + speedBonus));
  const pay = match.recipe.price + tip;
  state.score += pay;
  state.tips += tip;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.plate = [];
  state.servePulse = 1;
  state.lastServed = { name: match.recipe.name, pay, tip };
  state.popups.push({ x: LINE.windowX, y: LINE.y - 100, text: `+$${pay}`, life: 1.3, color: COLORS.good });
  if (state.combo > 1) {
    state.popups.push({ x: LINE.windowX, y: LINE.y - 128, text: `x${state.combo} combo`, life: 1.3, color: COLORS.amber });
  }
}

export function sameStack(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function starCount(state) {
  const s = state.score;
  if (s >= 240) return 3;
  if (s >= 150) return 2;
  if (s >= 70) return 1;
  return 0;
}

export function nextIngredientFor(state) {
  const o = state.tickets[0];
  if (!o) return null;
  const idx = state.plate.length;
  return o.recipe.stack[idx] || null;
}

export { CYCLE };
