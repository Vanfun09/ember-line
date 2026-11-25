// The room and the five stations, drawn back to front: wall, props, counter line, stations.

import { COLORS, LINE, GRILL, W, H } from './config.js';
import {
  rrect, ellipse, glow, shade, text, mix, drawFlame, drawIngredient, drawSteam,
  drawBurger, drawPatty, stackHeight,
} from './art.js';

const RAIN = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.5) % 300,
  y: (i * 61.7) % 250,
  len: 8 + (i % 5) * 4,
  speed: 240 + (i % 7) * 60,
}));

export function drawRoom(ctx, t, state) {
  // ---- back wall ----
  const wall = ctx.createLinearGradient(0, 0, 0, 470);
  wall.addColorStop(0, '#171112');
  wall.addColorStop(0.6, '#241a18');
  wall.addColorStop(1, '#2c1f1a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, 470);

  // subway tiles, dim and warm
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = COLORS.tileLine;
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    const y = 150 + row * 40;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.stroke();
    for (let col = 0; col < 27; col++) {
      const x = col * 50 + (row % 2 ? 25 : 0);
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x, y + 40);
      ctx.stroke();
    }
  }
  ctx.restore();

  // warm light pool from the hood lamps
  glow(ctx, 645, 250, 420, 'rgba(255,170,90,0.22)', 0.9);
  glow(ctx, 1120, 210, 240, 'rgba(255,140,60,0.16)', 0.9);

  drawNeon(ctx, t);
  drawShelf(ctx, t);
  drawWindow(ctx, t);
  drawHood(ctx, t, state);
  drawFloor(ctx);
}

function drawNeon(ctx, t) {
  const x = 300;
  const y = 96;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const flicker = 0.86 + Math.sin(t * 11) * 0.05 + Math.sin(t * 2.3) * 0.06;
  ctx.globalAlpha = flicker;
  ctx.strokeStyle = COLORS.neon;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.neon;
  ctx.shadowBlur = 22;
  // a fork and a flame, drawn as one neon glyph
  ctx.beginPath();
  ctx.moveTo(x - 62, y + 16);
  ctx.lineTo(x - 62, y - 12);
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 68 + i * 6, y - 18);
    ctx.lineTo(x - 68 + i * 6, y - 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 16);
  ctx.bezierCurveTo(x - 6, y - 2, x + 16, y - 10, x + 12, y - 26);
  ctx.bezierCurveTo(x + 30, y - 12, x + 30, y + 4, x + 14, y + 16);
  ctx.stroke();
  ctx.restore();
}

function drawShelf(ctx, t) {
  // copper pots and jars on a shelf, catching the hood light
  const y = 210;
  ctx.fillStyle = '#3a2a22';
  rrect(ctx, 60, y, 300, 9, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(60, y + 9, 300, 14);

  const pots = [
    { x: 96, w: 40, h: 30, c: COLORS.copper },
    { x: 152, w: 30, h: 24, c: COLORS.copperLit },
    { x: 200, w: 46, h: 34, c: '#8e5a33' },
  ];
  for (const p of pots) {
    const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    g.addColorStop(0, shade(p.c, -0.25));
    g.addColorStop(0.4, shade(p.c, 0.25));
    g.addColorStop(1, shade(p.c, -0.15));
    ctx.fillStyle = g;
    rrect(ctx, p.x, y - p.h, p.w, p.h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,200,0.35)';
    rrect(ctx, p.x + 6, y - p.h + 5, 5, p.h - 12, 2);
    ctx.fill();
    ctx.strokeStyle = '#6b4a2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x + p.w, y - p.h / 2, 7, -1.2, 1.2);
    ctx.stroke();
  }
  // spice jars
  const jars = ['#c94f3a', '#d9a441', '#7fa64a', '#b8703f'];
  jars.forEach((c, i) => {
    ctx.fillStyle = c;
    rrect(ctx, 262 + i * 22, y - 26, 16, 26, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rrect(ctx, 265 + i * 22, y - 23, 4, 14, 2);
    ctx.fill();
    ctx.fillStyle = '#4a4038';
    rrect(ctx, 261 + i * 22, y - 30, 18, 6, 3);
    ctx.fill();
  });
  // hanging utensils
  ctx.strokeStyle = '#4c4038';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const x = 400 + i * 40;
    ctx.beginPath();
    ctx.moveTo(x, 176); ctx.lineTo(x, 214);
    ctx.stroke();
    ctx.save();
    ctx.translate(x, 214);
    ctx.rotate(0.1 * Math.sin(t + i));
    ctx.fillStyle = '#9aa3a8';
    rrect(ctx, -2, 0, 4, 26, 2);
    ctx.fill();
    ellipse(ctx, 0, 30, 8, 10);
    ctx.fill();
    ctx.restore();
  }
}

function drawWindow(ctx, t) {
  const x = 30, y = 250, w = 190, h = 190;
  ctx.save();
  rrect(ctx, x, y, w, h, 8);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#16212c');
  g.addColorStop(0.55, '#1d2c38');
  g.addColorStop(1, '#2a333a');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();

  // street beyond: a lamp, two buildings, wet sidewalk sheen
  ctx.fillStyle = '#0f1a24';
  ctx.fillRect(x, y + 92, w, h);
  ctx.fillStyle = '#182833';
  ctx.fillRect(x + 8, y + 60, 70, 60);
  ctx.fillRect(x + 96, y + 40, 60, 80);
  glow(ctx, x + 158, y + 104, 60, 'rgba(255,176,92,0.55)', 0.9);
  ctx.fillStyle = '#ffd9a0';
  ellipse(ctx, x + 158, y + 108, 10, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,190,120,0.12)';
  ctx.fillRect(x + 120, y + 118, 76, 72);

  // rain
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
  ctx.restore();

  // frame + sill
  ctx.strokeStyle = '#3b2a1e';
  ctx.lineWidth = 9;
  rrect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.strokeStyle = '#3b2a1e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.fillStyle = '#4a3325';
  rrect(ctx, x - 10, y + h, w + 20, 10, 4);
  ctx.fill();
}

function drawHood(ctx, t, state) {
  // stainless exhaust hood over the grill, steam curling out of it
  const x = 520, y = 150, w = 300, h = 96;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#5d666c');
  g.addColorStop(0.4, '#8e9aa3');
  g.addColorStop(1, '#4a5359');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,22,0.5)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 20 + i * 4, y);
    ctx.lineTo(x + i * 60, y + h);
    ctx.stroke();
  }
  ctx.fillStyle = '#2b3136';
  rrect(ctx, x - 10, y + h - 8, w + 20, 12, 4);
  ctx.fill();
  // hood lamp glow + steam
  glow(ctx, x + w / 2, y + h + 30, 150, 'rgba(255,190,110,0.28)', 0.8);
  drawSteam(ctx, x + w * 0.35, y + h, 1.2, t, 70);
  drawSteam(ctx, x + w * 0.62, y + h - 6, 1.0, t * 1.3, 60);
}

function drawFloor(ctx) {
  const g = ctx.createLinearGradient(0, 560, 0, H);
  g.addColorStop(0, '#241a16');
  g.addColorStop(1, '#0f0b0a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 560, W, H - 560);
  // checkerboard in perspective
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let row = 0; row < 6; row++) {
    const y = 566 + row * row * 5 + row * 22;
    const hh = 18 + row * 6;
    for (let col = 0; col < 22; col++) {
      if ((row + col) % 2 === 0) continue;
      ctx.fillStyle = '#8b6a4a';
      ctx.fillRect(col * 64 - row * 12, y, 62, hh);
    }
  }
  ctx.restore();
  // warm wet reflection under the line
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 645, 660, 380, 'rgba(255,140,70,0.10)', 0.8);
  ctx.restore();
}

/* ---------------------------------- the counter ---------------------------------- */

export function drawCounter(ctx) {
  const top = LINE.counterTop;
  const bottom = LINE.counterBottom;

  // steel worktop
  const g = ctx.createLinearGradient(0, top, 0, top + 22);
  g.addColorStop(0, '#b9c2c7');
  g.addColorStop(0.5, '#8b959b');
  g.addColorStop(1, '#6a7378');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(0, top + 2, W, 2);

  // wood cabinet face with a warm bevel
  const wg = ctx.createLinearGradient(0, top + 22, 0, bottom + 26);
  wg.addColorStop(0, '#5a3a24');
  wg.addColorStop(0.5, '#432a1b');
  wg.addColorStop(1, '#2c1b12');
  ctx.fillStyle = wg;
  ctx.fillRect(0, top + 22, W, bottom - top + 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 3;
  for (let x = 0; x < W; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, top + 24); ctx.lineTo(x, bottom + 24);
    ctx.stroke();
  }
  // handles
  for (let x = 70; x < W; x += 160) {
    ctx.fillStyle = '#c8a06a';
    rrect(ctx, x, top + 46, 30, 6, 3);
    ctx.fill();
  }
  // toe kick
  ctx.fillStyle = '#140e0b';
  ctx.fillRect(0, bottom + 24, W, 18);
}

/* ---------------------------------- stations ---------------------------------- */

export function drawCrates(ctx, t, hover) {
  const x = LINE.crateX;
  const y = LINE.counterTop;
  // a stacked wooden crate of fixings
  ctx.save();
  ctx.fillStyle = '#6b4526';
  rrect(ctx, x - 78, y - 96, 156, 96, 6);
  ctx.fill();
  ctx.fillStyle = '#8a5c33';
  for (let i = 0; i < 4; i++) {
    rrect(ctx, x - 74, y - 92 + i * 22, 148, 15, 3);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x - 78, y - 8, 156, 8);

  // ingredients poking out of the crate
  const order = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'onion'];
  order.forEach((name, i) => {
    const bx = x - 58 + (i % 3) * 58;
    const by = y - 104 - Math.floor(i / 3) * 26 + Math.sin(t * 1.6 + i) * 1.2;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((i % 2 ? 1 : -1) * 0.12);
    drawIngredient(ctx, name, 0, 0, 0.42, t);
    ctx.restore();
  });
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.amber);
}

export function drawBoard(ctx, t, chop, hover) {
  const x = LINE.boardX;
  const y = LINE.counterTop;
  // cutting board
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rrect(ctx, x - 66, y - 8, 132, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#8a6440';
  rrect(ctx, x - 64, y - 14, 128, 18, 5);
  ctx.fill();
  ctx.fillStyle = '#a37b50';
  rrect(ctx, x - 60, y - 12, 120, 6, 3);
  ctx.fill();

  // chopped pile grows as you chop
  const p = Math.min(1, chop.progress / 1);
  if (chop.item) {
    for (let i = 0; i < 5; i++) {
      const bx = x - 26 + i * 13;
      drawIngredient(ctx, chop.item, bx, y - 20 - (i % 2) * 4, 0.2 + p * 0.05, t);
    }
  }
  // knife
  const swing = Math.sin(t * 14) * (chop.active ? 0.5 : 0);
  ctx.save();
  ctx.translate(x + 34, y - 30);
  ctx.rotate(-0.5 + swing);
  ctx.fillStyle = '#e6ecf0';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(46, 4); ctx.lineTo(46, 12); ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2a1e';
  rrect(ctx, -22, 0, 24, 9, 3);
  ctx.fill();
  ctx.restore();

  // progress ring while chopping
  if (chop.active) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y - 58, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = COLORS.amber;
    ctx.beginPath(); ctx.arc(x, y - 58, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.lettuce);
}

export function drawGrill(ctx, t, slots, hover) {
  const y = LINE.counterTop;
  // grill body
  ctx.save();
  ctx.fillStyle = '#20262b';
  rrect(ctx, GRILL.x - 150, y - 44, 300, 50, 8);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 44, 0, y - 8);
  g.addColorStop(0, '#333d44');
  g.addColorStop(1, '#1a1f23');
  ctx.fillStyle = g;
  rrect(ctx, GRILL.x - 146, y - 42, 292, 30, 6);
  ctx.fill();

  // grill bars
  ctx.strokeStyle = '#0e1114';
  ctx.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    const gx = GRILL.x - 132 + i * 33;
    ctx.beginPath();
    ctx.moveTo(gx, y - 40); ctx.lineTo(gx, y - 12);
    ctx.stroke();
  }

  // embers under the bars
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    glow(ctx, GRILL.x - 110 + i * 45, y - 14, 34, 'rgba(255,110,40,0.45)', 0.5);
  }
  ctx.restore();

  // four slots: patties with cook state, flames when fresh, smoke when burning
  slots.forEach((slot, i) => {
    const sx = GRILL.x + (i - (slots.length - 1) / 2) * GRILL.spacing;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ellipse(ctx, sx, y - 22, 24, 7);
    ctx.fill();
    if (slot) {
      const burn = slot.cook > 0.85;
      drawPatty(ctx, sx, y - 26, 0.62, slot.cook, burn);
      if (slot.cook < 0.35) drawFlame(ctx, sx, y - 14, 0.7, t, i);
      if (burn) drawSteam(ctx, sx, y - 34, 1.4, t * 1.6, 26);
      else if (slot.cook > 0.5) drawSteam(ctx, sx, y - 34, 0.5, t, 24);
    } else {
      ctx.fillStyle = 'rgba(255,120,50,0.22)';
      ellipse(ctx, sx, y - 24, 20, 6);
      ctx.fill();
    }
    ctx.restore();
  });

  // heat shimmer above the grate
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.12 + Math.sin(t * 3) * 0.03;
  ctx.fillStyle = '#ff9a4a';
  ctx.fillRect(GRILL.x - 150, y - 70, 300, 26);
  ctx.restore();
  ctx.restore();
  stationGlow(ctx, GRILL.x, hover, COLORS.ember);
}

export function drawPass(ctx, t, plate, hover) {
  const x = LINE.passX;
  const y = LINE.counterTop;
  // marble pass with a stack of clean plates
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 14, 0, y + 8);
  g.addColorStop(0, '#efe9dd');
  g.addColorStop(1, '#c4bcae');
  ctx.fillStyle = g;
  rrect(ctx, x - 108, y - 16, 216, 22, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  rrect(ctx, x - 102, y - 14, 204, 4, 2);
  ctx.fill();

  // spare plates
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 ? '#d8d2c6' : '#eae4d8';
    ellipse(ctx, x + 82, y - 26 - i * 5, 26, 7);
    ctx.fill();
  }

  // the plate being built on the pass
  if (plate.length === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ellipse(ctx, x - 8, y - 18, 46, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.plate;
    ellipse(ctx, x - 8, y - 24, 44, 11);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,130,110,0.5)';
    ctx.lineWidth = 1.5;
    ellipse(ctx, x - 8, y - 24, 42, 9.5);
    ctx.stroke();
    text(ctx, 'BUILD HERE', x - 8, y - 52, { size: 11, weight: 800, color: 'rgba(255,243,220,0.55)', align: 'center', letter: 1.6 });
  } else {
    drawBurger(ctx, plate, x - 8, y - 22 - stackHeight(plate) / 4, 0.72, { steam: 1, t });
  }
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.cream);
}

export function drawServeWindow(ctx, t, state, hover) {
  const x = LINE.windowX;
  const y = LINE.counterTop;
  ctx.save();
  // brass pass-through frame with a heat lamp
  ctx.fillStyle = '#3a2a20';
  rrect(ctx, x - 96, y - 150, 192, 150, 10);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 148, 0, y - 30);
  g.addColorStop(0, '#1b1412');
  g.addColorStop(1, '#2a201b');
  ctx.fillStyle = g;
  rrect(ctx, x - 88, y - 142, 176, 112, 8);
  ctx.fill();

  // heat lamp glow and hanging lamp
  glow(ctx, x, y - 128, 120, 'rgba(255,150,70,0.34)', 0.85);
  ctx.fillStyle = '#f4a259';
  ctx.beginPath();
  ctx.moveTo(x - 28, y - 168);
  ctx.lineTo(x + 28, y - 168);
  ctx.lineTo(x + 16, y - 146);
  ctx.lineTo(x - 16, y - 146);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ellipse(ctx, x, y - 146, 10, 6);
  ctx.fill();

  // the bell
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 66, y - 100); ctx.lineTo(x + 66, y - 84);
  ctx.stroke();
  ctx.fillStyle = '#d8a15a';
  ctx.beginPath();
  ctx.arc(x + 66, y - 84, 10, Math.PI, 0);
  ctx.fill();

  if (state && state.servePulse > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.servePulse);
    ctx.strokeStyle = COLORS.good;
    ctx.lineWidth = 4;
    rrect(ctx, x - 90, y - 144, 180, 116, 9);
    ctx.stroke();
    ctx.restore();
  }
  text(ctx, 'PASS', x, y - 118, { size: 13, weight: 800, color: 'rgba(255,243,220,0.4)', align: 'center', letter: 3 });
  ctx.restore();
  stationGlow(ctx, x, hover, COLORS.amber);
}

function stationGlow(ctx, x, hover, color) {
  if (!hover) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, LINE.counterTop - 24, 110, color, 0.22);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.ellipse(x, LINE.counterTop + 30, 78, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawForeground(ctx, t) {
  // spectator stools at the bottom edge, out of focus, to sell the diner
  for (const x of [220, 640, 1040]) {
    ctx.fillStyle = 'rgba(12,9,8,0.9)';
    rrect(ctx, x - 40, H - 40, 80, 46, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,50,40,0.55)';
    rrect(ctx, x - 44, H - 52, 88, 20, 10);
    ctx.fill();
  }
  // vignette
  const g = ctx.createRadialGradient(W / 2, H * 0.52, 260, W / 2, H * 0.52, 780);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.66)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
