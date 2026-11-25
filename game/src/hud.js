// Heads-up display: the ticket rail, the shift clock, the till, the carry tray and the
// title / summary cards. Everything is drawn on the same canvas, so it scales with it.

import { COLORS, W, H, LINE, SHIFT, INGREDIENTS, MENU } from './config.js';
import {
  rrect, ellipse, glow, text, mix, shade, drawTicket, drawIngredient, drawBurger, drawSteam,
} from './art.js';
import { starCount, nextIngredientFor, CYCLE } from './game.js';

const PILL = (ctx, x, y, w, h, color, alpha = 0.86) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  rrect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.restore();
};

export function drawHud(ctx, state, t) {
  if (state.mode === 'title') return;

  // ---------- top bar ----------
  ctx.save();
  const barG = ctx.createLinearGradient(0, 0, 0, 86);
  barG.addColorStop(0, 'rgba(10,7,7,0.94)');
  barG.addColorStop(1, 'rgba(10,7,7,0.0)');
  ctx.fillStyle = barG;
  ctx.fillRect(0, 0, W, 86);

  // shift clock
  const frac = Math.max(0, state.shiftLeft / SHIFT.seconds);
  const clockX = 42;
  text(ctx, 'SHIFT', clockX, 34, { size: 11, weight: 800, color: 'rgba(255,243,220,0.5)', letter: 3 });
  text(ctx, clock(state.shiftLeft), clockX, 62, { size: 26, weight: 800, color: frac < 0.2 ? COLORS.bad : COLORS.cream });
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rrect(ctx, clockX, 70, 150, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = frac < 0.2 ? COLORS.bad : COLORS.amber;
  rrect(ctx, clockX, 70, 150 * frac, 5, 2.5);
  ctx.fill();

  // till
  const moneyX = W / 2;
  text(ctx, 'TAKE', moneyX, 30, { size: 11, weight: 800, color: 'rgba(255,243,220,0.5)', align: 'center', letter: 3 });
  text(ctx, `$${state.score}`, moneyX, 64, { size: 32, weight: 800, color: COLORS.flame, align: 'center' });
  if (state.combo > 1) {
    PILL(ctx, moneyX + 80, 35, 92, 30, COLORS.ember, 0.92);
    text(ctx, `COMBO ${state.combo}`, moneyX + 126, 55, { size: 12.5, weight: 800, color: '#24100a', align: 'center', letter: 0.5 });
  }

  // open tickets count / lost
  text(ctx, `SERVED ${state.served}`, W - 40, 46, { size: 14, weight: 800, color: 'rgba(255,243,220,0.72)', align: 'right', letter: 1.2 });
  text(ctx, `WALKED OUT ${state.lost}`, W - 40, 66, { size: 12, weight: 700, color: state.lost ? 'rgba(255,107,94,0.8)' : 'rgba(255,243,220,0.35)', align: 'right', letter: 1 });

  // ---------- ticket rail ----------
  const railY = 104;
  ctx.strokeStyle = 'rgba(180,150,110,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, railY + 6);
  ctx.lineTo(860, railY + 6);
  ctx.stroke();

  const tw = 186;
  const tgap = 14;
  const ttotal = state.tickets.length * tw + Math.max(0, state.tickets.length - 1) * tgap;
  if (state.tickets.length) {
    ctx.fillStyle = 'rgba(10,8,7,0.9)';
    rrect(ctx, W / 2 - ttotal / 2 - 18, railY - 12, ttotal + 36, 168, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,243,220,0.1)';
    ctx.lineWidth = 1.5;
    rrect(ctx, W / 2 - ttotal / 2 - 18, railY - 12, ttotal + 36, 168, 14);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,179,71,0.55)';
    rrect(ctx, W / 2 - ttotal / 2 - 18, railY - 12, ttotal + 36, 3, 2);
    ctx.fill();
  }
  state.tickets.forEach((o, i) => {
    const x = W / 2 - ttotal / 2 + i * (tw + tgap);
    drawTicket(ctx, o, x, railY + 10, tw, 128, t, { hot: o.hot });
  });
  ctx.restore();

  drawStationLabels(ctx, state);
  drawTray(ctx, state, t);
  drawPopups(ctx, state);

  if (state.flash > 0) {
    ctx.save();
    ctx.globalAlpha = state.flash * 0.18;
    ctx.fillStyle = COLORS.bad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

function clock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawStationLabels(ctx, state) {
  const labels = [
    ['PANTRY', LINE.crateX, '1-6 take'],
    ['BOARD', LINE.boardX, 'E chop'],
    ['GRILL', LINE.grillX, 'E cook'],
    ['PASS', LINE.passX, 'E build'],
    ['SERVE', LINE.windowX, 'E hand off'],
  ];
  for (const [name, x, hint] of labels) {
    const hot = state.hover && Math.abs(x - state.chef.x) < 96 && isHot(state.hover, name);
    ctx.save();
    ctx.font = '800 12px Segoe UI, system-ui, sans-serif';
    const nw = ctx.measureText(name).width + 26;
    ctx.font = '600 11px Segoe UI, system-ui, sans-serif';
    const hw = ctx.measureText(hint).width + 22;
    const bw = Math.max(nw, hw, 96);
    const by = LINE.counterTop - (name === 'SERVE' ? 160 : 142);
    ctx.globalAlpha = hot ? 1 : 0.94;
    ctx.fillStyle = 'rgba(12,9,8,0.9)';
    rrect(ctx, x - bw / 2, by, bw, 38, 9);
    ctx.fill();
    ctx.strokeStyle = hot ? COLORS.amber : 'rgba(255,243,220,0.22)';
    ctx.lineWidth = 1.5;
    rrect(ctx, x - bw / 2, by, bw, 38, 9);
    ctx.stroke();
    text(ctx, name, x, by + 16, { size: 12, weight: 800, align: 'center', color: hot ? COLORS.amber : COLORS.cream, letter: 2.2 });
    text(ctx, hint, x, by + 30, { size: 11.5, weight: 700, align: 'center', color: hot ? 'rgba(255,243,220,0.9)' : 'rgba(255,243,220,0.66)' });
    ctx.restore();
  }
}

function isHot(hover, name) {
  const map = { crate: 'PANTRY', board: 'BOARD', grill: 'GRILL', pass: 'PASS', window: 'SERVE' };
  return map[hover] === name;
}

function drawTray(ctx, state) {
  const chef = state.chef;
  const y = 620;
  const x = chef.x;
  // carried items sit under the chef as small cards, so the pantry choice is legible
  if (chef.carry.length) {
    const w = chef.carry.length * 34 + 16;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'rgba(12,9,8,0.75)';
    rrect(ctx, x - w / 2, y - 8, w, 34, 8);
    ctx.fill();
    ctx.restore();
    chef.carry.forEach((n, i) => {
      const cx = x - w / 2 + 25 + i * 34;
      drawIngredient(ctx, n, cx, y + 8, 0.24, state.t);
      if (INGREDIENTS[n].veg) {
        const done = state.chopped.has(n);
        ctx.save();
        ctx.globalAlpha = done ? 0.9 : 0.55;
        text(ctx, done ? '✓' : 'raw', cx, y + 30, { size: 9, weight: 800, color: done ? COLORS.good : 'rgba(255,243,220,0.5)', align: 'center' });
        ctx.restore();
      }
    });
  }
}

function drawPopups(ctx, state) {
  ctx.save();
  for (const p of state.popups) {
    ctx.globalAlpha = Math.min(1, p.life * 1.6);
    text(ctx, p.text, p.x, p.y, { size: 20, weight: 800, color: p.color, align: 'center' });
  }
  ctx.restore();
}

/* ---------------------------------- title ---------------------------------- */

export function drawTitle(ctx, state, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(8,6,6,0.9)');
  g.addColorStop(0.5, 'rgba(8,6,6,0.58)');
  g.addColorStop(1, 'rgba(8,6,6,0.94)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // wordmark, left anchored so it never fights the hero shot
  text(ctx, 'EMBER LINE', 86, 128, { size: 74, weight: 800, color: COLORS.cream, letter: 6 });
  text(ctx, 'A LATE-NIGHT BURGER RUSH', 90, 164, { size: 14, weight: 700, color: 'rgba(255,179,71,0.9)', letter: 5.4 });
  ctx.fillStyle = 'rgba(255,179,71,0.5)';
  ctx.fillRect(90, 182, 336, 2);

  // hero burger, plated, right of frame
  drawBurger(ctx, ['bun', 'lettuce', 'tomato', 'cheese', 'patty', 'cheese', 'bun'], 948, 470, 2.15, { steam: 1.2, t });

  // controls card
  const px = 86, py = 402, pw = 470, ph = 194;
  ctx.fillStyle = 'rgba(14,10,9,0.78)';
  rrect(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,243,220,0.12)';
  ctx.lineWidth = 1.5;
  rrect(ctx, px, py, pw, ph, 14);
  ctx.stroke();
  text(ctx, 'THE LINE', px + 22, py + 30, { size: 11, weight: 800, color: 'rgba(255,243,220,0.4)', letter: 3.6 });

  const rows = [
    ['A D', 'walk the counter'],
    ['1-6', 'take an ingredient'],
    ['E', 'chop · grill · plate · serve'],
    ['Q', 'scrap the plate'],
  ];
  rows.forEach(([k, v], i) => {
    const y = py + 62 + i * 33;
    ctx.font = '800 12px Segoe UI, system-ui, sans-serif';
    const kw = Math.max(38, ctx.measureText(k).width + 20);
    ctx.fillStyle = 'rgba(255,179,71,0.14)';
    rrect(ctx, px + 22, y - 16, kw, 24, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,179,71,0.45)';
    ctx.lineWidth = 1;
    rrect(ctx, px + 22, y - 16, kw, 24, 6);
    ctx.stroke();
    text(ctx, k, px + 22 + kw / 2, y + 1, { size: 12, weight: 800, color: COLORS.amber, align: 'center', letter: 0.6 });
    text(ctx, v, px + 22 + kw + 16, y + 1, { size: 13.5, weight: 600, color: 'rgba(255,243,220,0.76)' });
  });

  const pulse = 0.6 + Math.sin(t * 3.4) * 0.32;
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER TO OPEN THE DOORS', 948, 640, { size: 15, weight: 800, color: COLORS.amber, align: 'center', letter: 2.6 });
  ctx.restore();
  text(ctx, `${SHIFT.seconds} seconds · ${SHIFT.maxTickets} tickets at a time · tip the jar with speed`, 948, 668, { size: 12.5, weight: 700, color: 'rgba(255,243,220,0.74)', align: 'center', letter: 0.8 });
}

/* ---------------------------------- summary ---------------------------------- */

export function drawSummary(ctx, state, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,6,6,0.82)';
  ctx.fillRect(0, 0, W, H);

  const cw = 620, ch = 400;
  const x = W / 2 - cw / 2, y = 150;
  ctx.fillStyle = 'rgba(20,15,13,0.96)';
  rrect(ctx, x, y, cw, ch, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,179,71,0.35)';
  ctx.lineWidth = 2;
  rrect(ctx, x, y, cw, ch, 16);
  ctx.stroke();

  text(ctx, 'SHIFT OVER', W / 2, y + 46, { size: 13, weight: 800, color: 'rgba(255,243,220,0.55)', align: 'center', letter: 5 });
  text(ctx, `$${state.score}`, W / 2, y + 110, { size: 62, weight: 800, color: COLORS.flame, align: 'center' });

  const stars = starCount(state);
  for (let i = 0; i < 3; i++) {
    const sx = W / 2 - 56 + i * 56;
    star(ctx, sx, y + 158, 18, i < stars ? COLORS.brass : 'rgba(255,243,220,0.16)');
  }

  const stats = [
    ['served', state.served],
    ['walked out', state.lost],
    ['best combo', state.bestCombo],
    ['in tips', `$${state.tips}`],
  ];
  stats.forEach(([k, v], i) => {
    const sx = x + 84 + (i % 2) * 236;
    const sy = y + 216 + Math.floor(i / 2) * 62;
    text(ctx, String(v), sx, sy, { size: 30, weight: 800, color: COLORS.cream });
    text(ctx, k.toUpperCase(), sx, sy + 20, { size: 11, weight: 700, color: 'rgba(255,243,220,0.45)', letter: 2 });
  });

  const pulse = 0.6 + Math.sin(t * 3.4) * 0.3;
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER FOR ANOTHER SHIFT', W / 2, y + ch - 34, { size: 14, weight: 800, color: COLORS.amber, align: 'center', letter: 3 });
  ctx.restore();
}

function star(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.46 : r;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export { MENU, CYCLE };
