// The room and the five stations, drawn back to front in one coherent orthographic side view:
// brick wall, props, counter line, stations, then the foreground grade.
// Every prop is lit from the hood side so the whole frame shares one light direction.

import { COLORS, LINE, GRILL, W, H } from './config.js';
import {
  rrect, ellipse, glow, shade, text, drawFlame, drawIngredient, drawSteam,
  drawBurger, drawPatty, stackHeight,
} from './art.js';

const RAIN = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.5) % 300,
  y: (i * 61.7) % 250,
  len: 8 + (i % 5) * 4,
  speed: 240 + (i % 7) * 60,
}));

// Deterministic brick tint so the wall texture never flickers between frames.
const BRICKS = (() => {
  const out = [];
  for (let row = 0; row < 9; row++) {
    for (let col = -1; col < 16; col++) {
      const seed = (row * 31 + col * 17 + 11) % 97;
      out.push({ x: col * 88 + (row % 2 ? 44 : 0), y: row * 34, tint: seed / 97 - 0.5 });
    }
  }
  return out;
})();

export function drawRoom(ctx, t, state) {
  // ---- back wall: brick, warm at the top, sooty near the hood ----
  const wall = ctx.createLinearGradient(0, 0, 0, LINE.counterTop);
  wall.addColorStop(0, '#1a1213');
  wall.addColorStop(0.55, '#2a1c18');
  wall.addColorStop(1, '#33231c');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, LINE.counterTop);

  ctx.save();
  ctx.globalAlpha = 0.55;
  for (const b of BRICKS) {
    ctx.fillStyle = b.tint > 0
      ? `rgba(214,120,74,${0.04 + b.tint * 0.1})`
      : `rgba(0,0,0,${0.04 - b.tint * 0.12})`;
    ctx.fillRect(b.x + 2, b.y + 2, 84, 30);
  }
  ctx.strokeStyle = 'rgba(12,8,8,0.55)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 9; row++) {
    const y = row * 34 + 32;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.stroke();
    for (let col = -1; col < 16; col++) {
      const x = col * 88 + (row % 2 ? 44 : 0);
      ctx.beginPath();
      ctx.moveTo(x, y - 32); ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  ctx.restore();

  // one shared light direction: hood lamps over the grill, spill to either side
  glow(ctx, 645, 268, 400, 'rgba(255,168,92,0.17)', 0.95);
  glow(ctx, 1150, 300, 300, 'rgba(255,140,60,0.16)', 0.9);
  glow(ctx, 260, 250, 260, 'rgba(120,170,220,0.10)', 0.8);

  drawNeon(ctx, t);
  drawShelf(ctx, t);
  drawWindow(ctx, t);
  drawChalkboard(ctx);
  drawHood(ctx, t, state);
  drawBrickLedge(ctx);
  drawFloor(ctx);
}

function drawNeon(ctx, t) {
  const x = 128, y = 58, w = 178, h = 64;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rrect(ctx, x + 5, y + 7, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#140f12';
  rrect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  rrect(ctx, x, y, w, h, 10);
  ctx.stroke();

  const flicker = 0.9 + Math.sin(t * 11) * 0.04 + Math.sin(t * 2.3) * 0.05;
  ctx.globalAlpha = flicker;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = COLORS.neon;
  ctx.shadowColor = COLORS.neon;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';

  const fx = x + 26;
  ctx.beginPath();
  ctx.moveTo(fx, y + 44);
  ctx.lineTo(fx, y + 24);
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(fx - 1 + i * 5, y + 19);
    ctx.lineTo(fx - 1 + i * 5, y + 30);
    ctx.stroke();
  }
  const gx = x + w - 28;
  ctx.beginPath();
  ctx.moveTo(gx, y + 44);
  ctx.bezierCurveTo(gx - 12, y + 32, gx + 5, y + 27, gx + 2, y + 15);
  ctx.bezierCurveTo(gx + 16, y + 26, gx + 16, y + 39, gx + 4, y + 44);
  ctx.stroke();
  text(ctx, 'OPEN', x + w / 2 + 1, y + 42, { size: 21, weight: 800, color: COLORS.neon, align: 'center', letter: 3 });
  ctx.restore();
}

function drawShelf(ctx, t) {
  const y = 208;
  ctx.fillStyle = '#3d2b21';
  rrect(ctx, 56, y, 318, 10, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(56, y + 10, 318, 13);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(70, y + 23, 10, 16);
  ctx.fillRect(352, y + 23, 10, 16);

  const pots = [
    { x: 92, w: 42, h: 32, c: COLORS.copper },
    { x: 150, w: 30, h: 24, c: COLORS.copperLit },
    { x: 198, w: 48, h: 36, c: '#8e5a33' },
    { x: 262, w: 26, h: 22, c: COLORS.copper },
  ];
  for (const p of pots) {
    const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    g.addColorStop(0, shade(p.c, -0.34));
    g.addColorStop(0.32, shade(p.c, 0.3));
    g.addColorStop(1, shade(p.c, -0.22));
    ctx.fillStyle = g;
    rrect(ctx, p.x, y - p.h, p.w, p.h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,238,206,0.4)';
    rrect(ctx, p.x + 6, y - p.h + 5, 4, p.h - 13, 2);
    ctx.fill();
    ctx.strokeStyle = '#6b4a2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x + p.w, y - p.h / 2, 7, -1.2, 1.2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ellipse(ctx, p.x + p.w / 2, y + 2, p.w * 0.5, 3);
    ctx.fill();
  }

  const jars = ['#c94f3a', '#d9a441', '#7fa64a', '#b8703f'];
  jars.forEach((c, i) => {
    const jx = 306 + i * 18;
    ctx.fillStyle = c;
    rrect(ctx, jx, y - 26, 14, 26, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    rrect(ctx, jx + 3, y - 23, 4, 14, 2);
    ctx.fill();
    ctx.fillStyle = '#4a4038';
    rrect(ctx, jx - 1, y - 30, 16, 6, 3);
    ctx.fill();
  });

  // hanging rail with three steel pans
  ctx.strokeStyle = '#4c4038';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(96, y + 34);
  ctx.lineTo(288, y + 34);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const x = 132 + i * 60;
    ctx.beginPath();
    ctx.moveTo(x, y + 34); ctx.lineTo(x, y + 54);
    ctx.stroke();
    const pg = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
    pg.addColorStop(0, shade(COLORS.steelDark, -0.24));
    pg.addColorStop(0.45, COLORS.steel);
    pg.addColorStop(1, shade(COLORS.steelDark, -0.28));
    ctx.fillStyle = pg;
    rrect(ctx, x - 24, y + 54, 48, 24, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(18,16,15,0.6)';
    ellipse(ctx, x, y + 55, 22, 5);
    ctx.fill();
  }
}

function drawWindow(ctx, t) {
  const x = 34, y = 244, w = 188, h = 168;
  ctx.save();
  rrect(ctx, x, y, w, h, 8);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#1c2a38');
  g.addColorStop(0.55, '#1d2c38');
  g.addColorStop(1, '#2a333a');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();

  ctx.fillStyle = '#0f1a24';
  ctx.fillRect(x, y + 84, w, h);
  ctx.fillStyle = '#182833';
  ctx.fillRect(x + 8, y + 52, 66, 60);
  ctx.fillRect(x + 92, y + 34, 58, 78);
  ctx.fillStyle = 'rgba(255,205,140,0.25)';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) ctx.fillRect(x + 18 + c * 24, y + 62 + r * 18, 12, 10);
  }
  glow(ctx, x + 154, y + 98, 66, 'rgba(255,176,92,0.5)', 0.9);
  ctx.fillStyle = '#ffd9a0';
  ellipse(ctx, x + 154, y + 102, 9, 9);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,190,120,0.12)';
  ctx.fillRect(x + 116, y + 110, 74, 66);
  ctx.fillStyle = 'rgba(255,180,110,0.14)';
  ellipse(ctx, x + 150, y + 158, 44, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(196,224,255,0.35)';
  ctx.lineWidth = 1.4;
  for (const d of RAIN) {
    const yy = y + ((d.y + t * d.speed) % h);
    const xx = x + ((d.x + t * 24) % w);
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.lineTo(xx - 2, yy + d.len);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,225,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(x + 10, y + h); ctx.lineTo(x + 74, y); ctx.lineTo(x + 104, y); ctx.lineTo(x + 40, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#3b2a1e';
  ctx.lineWidth = 10;
  rrect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.strokeStyle = '#33241a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h * 0.55); ctx.lineTo(x + w, y + h * 0.55);
  ctx.stroke();
  ctx.fillStyle = '#4a3325';
  rrect(ctx, x - 12, y + h, w + 24, 10, 4);
  ctx.fill();
}

function drawChalkboard(ctx) {
  // the menu, written where the line can read it — also gives the frame text at a distance
  const x = 1002, y = 40, w = 232, h = 186;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rrect(ctx, x + 5, y + 7, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#3a2718';
  rrect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#20261f';
  rrect(ctx, x + 9, y + 9, w - 18, h - 18, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ellipse(ctx, x + 70, y + 150, 60, 26);
  ctx.fill();

  text(ctx, 'THE LINE', x + w / 2, y + 40, { size: 15, weight: 800, color: 'rgba(255,243,220,0.95)', align: 'center', letter: 4 });
  ctx.fillStyle = 'rgba(255,243,220,0.28)';
  ctx.fillRect(x + 34, y + 52, w - 68, 1.5);
  const rows = [['CLASSIC', '$8'], ['GARDEN', '$7'], ['DOUBLE EMBER', '$12'], ['NIGHT STACK', '$11']];
  rows.forEach(([name, price], i) => {
    const ry = y + 74 + i * 26;
    text(ctx, name, x + 30, ry, { size: 13, weight: 700, color: 'rgba(255,243,220,0.84)', letter: 1.4 });
    text(ctx, price, x + w - 30, ry, { size: 14, weight: 800, color: 'rgba(255,214,120,1)', align: 'right' });
  });
  text(ctx, 'NO SUBSTITUTIONS', x + w / 2, y + h - 16, { size: 10.5, weight: 700, color: 'rgba(255,107,94,0.6)', align: 'center', letter: 2.4 });
  ctx.restore();
}

function drawHood(ctx, t, state) {
  const x = 512, y = 148, w = 312, h = 100;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#61696f');
  g.addColorStop(0.4, '#96a1a9');
  g.addColorStop(1, '#454d53');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + 22, y);
  ctx.lineTo(x + w - 22, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,22,0.45)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 22 + i * 4, y);
    ctx.lineTo(x + i * 62, y + h);
    ctx.stroke();
  }
  const lip = ctx.createLinearGradient(0, y + h - 12, 0, y + h + 6);
  lip.addColorStop(0, '#2b3136');
  lip.addColorStop(1, '#1a1f23');
  ctx.fillStyle = lip;
  rrect(ctx, x - 12, y + h - 10, w + 24, 14, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,196,120,0.85)';
  for (let i = 0; i < 3; i++) {
    ellipse(ctx, x + 80 + i * 76, y + h + 1, 15, 4);
    ctx.fill();
  }
  glow(ctx, x + w / 2, y + h + 34, 165, 'rgba(255,190,110,0.3)', 0.85);
  drawSteam(ctx, x + w * 0.34, y + h + 4, 1.15, t, 70);
  drawSteam(ctx, x + w * 0.64, y + h - 2, 0.95, t * 1.3, 58);
}

function drawBrickLedge(ctx) {
  const y = LINE.counterTop - 16;
  const g = ctx.createLinearGradient(0, y, 0, y + 18);
  g.addColorStop(0, '#4a332a');
  g.addColorStop(1, '#2a1d18');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, 18);
  ctx.fillStyle = 'rgba(255,190,140,0.10)';
  ctx.fillRect(0, y, W, 2);
}

function drawFloor(ctx) {
  const top = LINE.counterBottom + 18;
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, '#2a1e18');
  g.addColorStop(0.55, '#1a1310');
  g.addColorStop(1, '#0d0908');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, H - top);

  // flat checkered tile, same projection as the counter: no vanishing point
  ctx.save();
  ctx.globalAlpha = 0.27;
  const tile = 64;
  for (let row = 0; row * 34 < H - top + 34; row++) {
    const y = top + row * 34;
    for (let col = -1; col < W / tile + 2; col++) {
      if ((row + col) % 2 === 0) continue;
      ctx.fillStyle = '#b08a63';
      ctx.fillRect(col * tile, y, tile - 2, 32);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 645, top + 74, 430, 'rgba(255,140,70,0.13)', 0.9);
  glow(ctx, 1120, top + 60, 260, 'rgba(255,150,80,0.10)', 0.9);
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, top - 4, W, 6);
}

/* ---------------------------------- the counter ---------------------------------- */

export function drawCounter(ctx) {
  const top = LINE.counterTop;
  const bottom = LINE.counterBottom;

  const g = ctx.createLinearGradient(0, top, 0, top + 24);
  g.addColorStop(0, '#cfd6da');
  g.addColorStop(0.35, '#9aa4aa');
  g.addColorStop(0.7, '#7c868c');
  g.addColorStop(1, '#5c666b');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(0, top + 2, W, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, top + 22, W, 3);

  const wg = ctx.createLinearGradient(0, top + 24, 0, bottom + 26);
  wg.addColorStop(0, '#6d472c');
  wg.addColorStop(0.5, '#462c1c');
  wg.addColorStop(1, '#2b1a11');
  ctx.fillStyle = wg;
  ctx.fillRect(0, top + 25, W, bottom - top + 2);

  for (let x = 0; x < W; x += 160) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, top + 25, 3, bottom - top + 2);
    ctx.fillStyle = 'rgba(255,200,150,0.06)';
    ctx.fillRect(x + 4, top + 25, 2, bottom - top + 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2;
    rrect(ctx, x + 26, top + 38, 108, bottom - top - 22, 4);
    ctx.stroke();
  }
  for (let x = 70; x < W; x += 160) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rrect(ctx, x + 1, top + 47, 30, 7, 3);
    ctx.fill();
    ctx.fillStyle = '#d0a86f';
    rrect(ctx, x, top + 45, 30, 6, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    rrect(ctx, x + 2, top + 45, 26, 2, 1);
    ctx.fill();
  }

  ctx.fillStyle = '#140e0b';
  ctx.fillRect(0, bottom + 24, W, 16);
  ctx.fillStyle = 'rgba(200,160,106,0.55)';
  ctx.fillRect(0, bottom + 16, W, 4);

}

/* ---------------------------------- stations ---------------------------------- */

export function drawCrates(ctx, t, hover) {
  const x = LINE.crateX;
  const y = LINE.counterTop;
  const order = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'onion'];

  ctx.save();
  for (let b = 0; b < 2; b++) {
    const bx = x - 84 + b * 88;
    const by = y - 62;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rrect(ctx, bx + 3, by + 4, 80, 62, 5);
    ctx.fill();
    const g = ctx.createLinearGradient(bx, by, bx + 80, by + 62);
    g.addColorStop(0, '#8a5c33');
    g.addColorStop(1, '#5c3a1f');
    ctx.fillStyle = g;
    rrect(ctx, bx, by, 80, 62, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let i = 0; i < 3; i++) ctx.fillRect(bx + 4, by + 12 + i * 18, 72, 3);
    ctx.fillStyle = 'rgba(255,214,160,0.12)';
    rrect(ctx, bx + 6, by + 4, 68, 5, 2);
    ctx.fill();
  }
  ctx.restore();

  order.forEach((name, i) => {
    const bx = x - 62 + (i % 3) * 58;
    const by = y - 62 - Math.floor(i / 3) * 30 + Math.sin(t * 1.6 + i) * 1.2;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((i % 2 ? 1 : -1) * 0.1);
    drawIngredient(ctx, name, 0, 0, 0.44, t);
    ctx.restore();
  });

  // keycaps numbered to the hop order, tucked on the counter lip
  order.forEach((name, i) => {
    const kx = x - 74 + i * 30;
    const ky = y + 10;
    ctx.fillStyle = 'rgba(12,9,8,0.8)';
    rrect(ctx, kx - 10, ky - 9, 20, 18, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,179,71,0.45)';
    ctx.lineWidth = 1;
    rrect(ctx, kx - 10, ky - 9, 20, 18, 4);
    ctx.stroke();
    text(ctx, String(i + 1), kx, ky + 4.5, { size: 11, weight: 800, color: COLORS.amber, align: 'center' });
  });

  stationGlow(ctx, x, hover, COLORS.amber);
}

export function drawBoard(ctx, t, chop, hover) {
  const x = LINE.boardX;
  const y = LINE.counterTop;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rrect(ctx, x - 68, y - 10, 136, 22, 5);
  ctx.fill();
  ctx.fillStyle = '#9a7048';
  rrect(ctx, x - 66, y - 18, 132, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#b08656';
  rrect(ctx, x - 62, y - 16, 124, 7, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(90,60,30,0.35)';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 56, y - 8 + i * 2, 112, 1);

  ctx.fillStyle = '#cfd6da';
  ellipse(ctx, x - 54, y - 24, 16, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,20,14,0.55)';
  ellipse(ctx, x - 54, y - 25, 13, 5);
  ctx.fill();

  const p = Math.min(1, chop.progress / 1);
  if (chop.item) {
    for (let i = 0; i < 6; i++) {
      const bx = x - 26 + (i % 3) * 20;
      const by = y - 24 - Math.floor(i / 3) * 8;
      drawIngredient(ctx, chop.item, bx, by, 0.22 + p * 0.05, t);
    }
  }

  const swing = Math.sin(t * 16) * (chop.active ? 0.3 : 0);
  ctx.save();
  ctx.translate(x + 30, y - 16);
  ctx.rotate(-0.1 + swing);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ellipse(ctx, 16, 10, 30, 5);
  ctx.fill();
  const bg = ctx.createLinearGradient(0, -4, 0, 10);
  bg.addColorStop(0, '#f2f6f8');
  bg.addColorStop(0.6, '#cdd7dd');
  bg.addColorStop(1, '#8f9ba3');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(0, -4); ctx.lineTo(50, 2); ctx.lineTo(50, 10); ctx.lineTo(0, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,26,32,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#2f2419';
  rrect(ctx, -26, -4, 28, 13, 3);
  ctx.fill();
  ctx.fillStyle = '#c9d3d8';
  rrect(ctx, -1, -4, 4, 13, 1);
  ctx.fill();
  ctx.restore();

  if (chop.active) {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y - 66, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = COLORS.amber;
    ctx.beginPath(); ctx.arc(x, y - 66, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke();
    text(ctx, 'CHOP', x, y - 61, { size: 9.5, weight: 800, color: COLORS.cream, align: 'center', letter: 1.6 });
  }
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.lettuce);
}

export function drawGrill(ctx, t, slots, hover) {
  const y = LINE.counterTop;
  ctx.save();
  ctx.fillStyle = '#1b1f22';
  rrect(ctx, GRILL.x - 156, y - 52, 312, 58, 9);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 50, 0, y - 6);
  g.addColorStop(0, '#39434a');
  g.addColorStop(0.5, '#252c31');
  g.addColorStop(1, '#14181b');
  ctx.fillStyle = g;
  rrect(ctx, GRILL.x - 150, y - 48, 300, 36, 7);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const flick = 0.3 + Math.sin(t * 5 + i) * 0.08;
    glow(ctx, GRILL.x - 120 + i * 34, y - 12, 30, `rgba(255,110,40,${flick})`, 0.55);
  }
  ctx.restore();

  ctx.strokeStyle = '#0d1013';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const gx = GRILL.x - 132 + i * 29;
    ctx.beginPath();
    ctx.moveTo(gx, y - 44); ctx.lineTo(gx, y - 10);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(190,205,215,0.16)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    const gx = GRILL.x - 133 + i * 29;
    ctx.beginPath();
    ctx.moveTo(gx, y - 44); ctx.lineTo(gx, y - 10);
    ctx.stroke();
  }

  slots.forEach((slot, i) => {
    const sx = GRILL.x + (i - (slots.length - 1) / 2) * GRILL.spacing;
    if (!slot) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 2;
      ellipse(ctx, sx, y - 26, 21, 8);
      ctx.stroke();
      return;
    }
    const burn = slot.cook > 1.18;
    const ready = slot.cook >= 0.55 && slot.cook <= 1.18;
    drawPatty(ctx, sx, y - 30, 0.8, slot.cook, burn);

    const frac = Math.min(1, slot.cook / 1.35);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, y - 30, 26, 0, Math.PI * 2);
    ctx.stroke();
    const tone = burn ? COLORS.bad : ready ? COLORS.good : COLORS.amber;
    ctx.strokeStyle = tone;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(sx, y - 30, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();

    if (slot.cook < 0.2) drawFlame(ctx, sx, y - 12, 0.7, t, i);
    if (burn) drawSteam(ctx, sx, y - 38, 1.5, t * 1.7, 26);
    else if (slot.cook > 0.35) drawSteam(ctx, sx, y - 38, 0.45, t, 24);

    // every slot states its condition in words: raw, cooking, ready, burnt
    const label = burn ? 'BURNT' : ready ? 'READY' : slot.cook > 0.2 ? 'COOKING' : 'RAW';
    const pulse = ready ? 0.62 + Math.sin(t * 4 + i) * 0.2 : 1;
    ctx.save();
    ctx.globalAlpha = pulse;
    text(ctx, label, sx, y - 66, { size: 9.5, weight: 800, color: tone, align: 'center', letter: 1.3 });
    ctx.restore();
  });

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.1 + Math.sin(t * 3) * 0.025;
  ctx.fillStyle = '#ff9a4a';
  ctx.fillRect(GRILL.x - 150, y - 76, 300, 26);
  ctx.restore();
  ctx.restore();
  stationGlow(ctx, GRILL.x, hover, COLORS.ember);
}

export function drawPass(ctx, t, plate, hover, showHint = true) {
  const x = LINE.passX;
  const y = LINE.counterTop;
  ctx.save();

  const g = ctx.createLinearGradient(0, y - 18, 0, y + 8);
  g.addColorStop(0, '#f3eee3');
  g.addColorStop(0.6, '#ded7c8');
  g.addColorStop(1, '#b8b0a1');
  ctx.fillStyle = g;
  rrect(ctx, x - 112, y - 18, 224, 24, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,80,66,0.4)';
  ctx.lineWidth = 1.5;
  rrect(ctx, x - 112, y - 18, 224, 24, 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,112,96,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 96, y - 12);
  ctx.bezierCurveTo(x - 40, y - 16, x + 10, y - 2, x + 104, y - 8);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#d5cec1' : '#eae3d6';
    ellipse(ctx, x + 86, y - 24 - i * 5, 25, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,130,110,0.35)';
    ctx.lineWidth = 1;
    ellipse(ctx, x + 86, y - 24 - i * 5, 24, 6.5);
    ctx.stroke();
  }

  // ticket spike with the last chits impaled on it
  ctx.strokeStyle = '#8b8578';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 96, y - 26); ctx.lineTo(x - 96, y - 74);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(x - 96, y - 34 - i * 11);
    ctx.rotate((i - 1) * 0.08);
    ctx.fillStyle = 'rgba(251,243,226,0.9)';
    rrect(ctx, -16, -5, 34, 10, 1);
    ctx.fill();
    ctx.fillStyle = 'rgba(80,60,45,0.35)';
    ctx.fillRect(-12, -2, 20, 1);
    ctx.fillRect(-12, 1, 14, 1);
    ctx.restore();
  }

  if (plate.length === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ellipse(ctx, x - 12, y - 16, 46, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.plate;
    ellipse(ctx, x - 12, y - 22, 44, 11);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,130,110,0.5)';
    ctx.lineWidth = 1.5;
    ellipse(ctx, x - 12, y - 22, 42, 9.5);
    ctx.stroke();
    if (showHint) text(ctx, 'BUILD HERE', x - 12, y - 46, { size: 10, weight: 800, color: 'rgba(255,243,220,0.45)', align: 'center', letter: 1.6 });
  } else {
    drawBurger(ctx, plate, x - 12, y - 20 - stackHeight(plate) / 4, 0.76, { steam: 1, t });
  }
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.cream);
}

export function drawServeWindow(ctx, t, state, hover) {
  const x = LINE.windowX;
  const y = LINE.counterTop;
  ctx.save();

  // the pass-through itself: brass frame, warm room beyond, two customers waiting
  ctx.fillStyle = '#2b1e17';
  rrect(ctx, x - 108, y - 172, 216, 172, 10);
  ctx.fill();

  const room = ctx.createLinearGradient(0, y - 164, 0, y - 24);
  room.addColorStop(0, '#241814');
  room.addColorStop(0.5, '#33201a');
  room.addColorStop(1, '#1b1210');
  ctx.fillStyle = room;
  rrect(ctx, x - 98, y - 162, 196, 138, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,180,110,0.10)';
  ctx.fillRect(x - 98, y - 162, 196, 60);
  silhouette(ctx, x - 52, y - 96, 1.0, 0.9);
  silhouette(ctx, x + 40, y - 92, 0.86, 0.62);

  glow(ctx, x, y - 150, 130, 'rgba(255,160,80,0.34)', 0.9);
  ctx.strokeStyle = 'rgba(60,44,32,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 172); ctx.lineTo(x, y - 148);
  ctx.stroke();
  ctx.fillStyle = '#f6b06a';
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 148);
  ctx.quadraticCurveTo(x, y - 136, x + 20, y - 148);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe1ad';
  ellipse(ctx, x, y - 146, 8, 4);
  ctx.fill();

  ctx.strokeStyle = '#7a5a34';
  ctx.lineWidth = 8;
  rrect(ctx, x - 108, y - 172, 216, 172, 10);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,192,115,0.55)';
  ctx.lineWidth = 2;
  rrect(ctx, x - 104, y - 168, 208, 164, 8);
  ctx.stroke();

  // marble hand-off shelf, the real landing spot for a plated order
  const sg = ctx.createLinearGradient(0, y - 34, 0, y + 2);
  sg.addColorStop(0, '#fbf6ea');
  sg.addColorStop(1, '#c3bbab');
  ctx.fillStyle = sg;
  rrect(ctx, x - 96, y - 34, 192, 36, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,100,80,0.35)';
  ctx.lineWidth = 1.5;
  rrect(ctx, x - 96, y - 34, 192, 36, 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  rrect(ctx, x - 92, y - 32, 184, 3, 2);
  ctx.fill();

  // service bell
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 66, y - 74); ctx.lineTo(x + 66, y - 60);
  ctx.stroke();
  const bellG = ctx.createLinearGradient(x + 50, 0, x + 82, 0);
  bellG.addColorStop(0, '#b57f3d');
  bellG.addColorStop(0.45, '#f3cb87');
  bellG.addColorStop(1, '#a4702f');
  ctx.fillStyle = bellG;
  ctx.beginPath();
  ctx.arc(x + 66, y - 58, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ellipse(ctx, x + 61, y - 66, 4, 3, -0.4);
  ctx.fill();

  text(ctx, 'ORDER UP', x, y - 44, { size: 10.5, weight: 800, color: 'rgba(255,243,220,0.4)', align: 'center', letter: 3 });

  if (state && state.servePulse > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.servePulse);
    glow(ctx, x, y - 18, 110, 'rgba(255,196,120,0.6)', 0.55);
    ctx.restore();
  }
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.amber);
}

function silhouette(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0f0a09';
  ctx.translate(x, y);
  ctx.scale(s, s);
  ellipse(ctx, 0, -34, 14, 13);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-20, 30);
  ctx.quadraticCurveTo(-22, -16, -12, -22);
  ctx.lineTo(12, -22);
  ctx.quadraticCurveTo(22, -16, 20, 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,180,110,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -20);
  ctx.quadraticCurveTo(-21, -10, -20, 26);
  ctx.stroke();
  ctx.restore();
}

function stationGlow(ctx, x, hover, color) {
  if (!hover) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, LINE.counterTop - 30, 120, color, 0.24);
  ctx.restore();
}

export function drawForeground(ctx, t) {
  const g = ctx.createRadialGradient(W / 2, H * 0.5, 300, W / 2, H * 0.5, 820);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
