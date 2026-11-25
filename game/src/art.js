// Vector art. No sprites, no fonts beyond the system stack: every pixel here is drawn by code
// so the kitchen keeps its look at any window size and the game ships as text.

import { COLORS } from './config.js';

export function rrect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

export function glow(ctx, x, y, r, color, alpha = 0.55) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${c(A.r, B.r)},${c(A.g, B.g)},${c(A.b, B.b)})`;
}

export function shade(hex, amount) {
  return amount >= 0 ? mix(hex, '#ffffff', amount) : mix(hex, '#000000', -amount);
}

export function text(ctx, str, x, y, { size = 18, weight = 700, color = COLORS.cream, align = 'left', font = 'Segoe UI, system-ui, sans-serif', baseline = 'alphabetic', letter = 0 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (letter) {
    // Manual letter spacing keeps the condensed label look without a webfont.
    const chars = [...str];
    const widths = chars.map((c) => ctx.measureText(c).width + letter);
    const total = widths.reduce((a, b) => a + b, 0) - letter;
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    ctx.textAlign = 'left';
    chars.forEach((c, i) => {
      ctx.fillText(c, cx, y);
      cx += widths[i];
    });
  } else {
    ctx.fillText(str, x, y);
  }
  ctx.restore();
}

/* ---------------------------------- ingredients ---------------------------------- */

const SEEDS = [
  [-0.44, -0.30], [-0.12, -0.44], [0.26, -0.36], [0.5, -0.08],
  [-0.3, 0.02], [0.06, -0.1], [0.38, 0.14], [-0.52, -0.06], [0.16, 0.24],
];

export function drawBunTop(ctx, x, y, s, lit = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -30, 0, 10);
  g.addColorStop(0, shade(COLORS.bunLit, 0.12 * lit));
  g.addColorStop(0.55, COLORS.bun);
  g.addColorStop(1, COLORS.bunDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-40, 6);
  ctx.bezierCurveTo(-42, -26, -20, -38, 0, -38);
  ctx.bezierCurveTo(22, -38, 42, -26, 40, 6);
  ctx.bezierCurveTo(40, 12, -40, 12, -40, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(-13, -25, 13, 6, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  for (const [sx, sy] of SEEDS) {
    ctx.save();
    ctx.translate(sx * 40, sy * 34);
    ctx.rotate(sx * 0.9);
    ellipse(ctx, 0, 0, 2.6, 1.5);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawBunBottom(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -8, 0, 14);
  g.addColorStop(0, COLORS.bun);
  g.addColorStop(1, COLORS.bunDark);
  ctx.fillStyle = g;
  rrect(ctx, -40, -8, 80, 20, 9);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  rrect(ctx, -40, 4, 80, 8, 6);
  ctx.fill();
  ctx.restore();
}

export function drawPatty(ctx, x, y, s, cook = 0, charred = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const base = cook < 0.15 ? COLORS.pattyRaw : mix(COLORS.pattyRaw, COLORS.patty, Math.min(1, cook * 1.5));
  const g = ctx.createLinearGradient(0, -12, 0, 12);
  g.addColorStop(0, shade(base, 0.16));
  g.addColorStop(1, shade(base, -0.3));
  ctx.fillStyle = g;
  rrect(ctx, -41, -11, 82, 22, 10);
  ctx.fill();
  if (cook > 0.25) {
    ctx.strokeStyle = charred ? COLORS.pattyChar : 'rgba(30,14,8,0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-26 + i * 6, -6 + i * 5);
      ctx.lineTo(26 + i * 6, -2 + i * 5);
      ctx.stroke();
    }
  }
  if (charred) {
    ctx.fillStyle = 'rgba(20,10,6,0.75)';
    for (const p of [[-22, 2], [4, -4], [21, 5], [-6, 6]]) ellipse(ctx, p[0], p[1], 5, 3, 0.4), ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ellipse(ctx, -12, -6, 16, 4, -0.2);
  ctx.fill();
  ctx.restore();
}

export function drawCheese(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -8, 0, 10);
  g.addColorStop(0, '#ffe08a');
  g.addColorStop(1, COLORS.cheese);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-40, -4); ctx.lineTo(40, -4); ctx.lineTo(38, 6);
  ctx.quadraticCurveTo(26, 18, 12, 7); ctx.quadraticCurveTo(0, 20, -12, 7);
  ctx.quadraticCurveTo(-26, 18, -39, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(-28, -1); ctx.lineTo(6, -1); ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawLeaf(ctx, x, y, s, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -10, 0, 12);
  g.addColorStop(0, COLORS.lettuce);
  g.addColorStop(1, COLORS.lettuceDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.bezierCurveTo(-40, -18, -12, -16, 2, -4 + Math.sin(t) * 1.5);
  ctx.bezierCurveTo(18, -18, 42, -14, 44, 2);
  ctx.bezierCurveTo(36, 14, 16, 12, 0, 6);
  ctx.bezierCurveTo(-16, 14, -36, 12, -44, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -2); ctx.quadraticCurveTo(-6, -8, 18, -2);
  ctx.stroke();
  ctx.restore();
}

export function drawTomato(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -9, 0, 9);
  g.addColorStop(0, '#ff6d5c');
  g.addColorStop(1, '#c9302a');
  ctx.fillStyle = g;
  rrect(ctx, -36, -8, 72, 16, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,180,150,0.6)';
  for (const i of [-20, 0, 20]) {
    ellipse(ctx, i, 0, 9, 5);
    ctx.fill();
  }
  ctx.restore();
}

export function drawOnion(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#e6d0f0';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * 24, -2, 16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * 24, -3, 16, 0.25 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

// One ingredient tile, drawn the same on the pass, in the hand and on a ticket.
export function drawIngredient(ctx, name, x, y, s = 1, t = 0, cook = 1) {
  switch (name) {
    case 'bun': return drawBunTop(ctx, x, y, s * 0.92);
    case 'patty': return drawPatty(ctx, x, y, s * 0.92, cook);
    case 'cheese': return drawCheese(ctx, x, y, s * 0.92);
    case 'lettuce': return drawLeaf(ctx, x, y, s * 0.8, t);
    case 'tomato': return drawTomato(ctx, x, y, s * 0.95);
    case 'onion': return drawOnion(ctx, x, y, s * 0.95);
    default: return undefined;
  }
}

/* ---------------------------------- plated burger ---------------------------------- */

const LAYER_H = { bun: 22, patty: 16, cheese: 8, lettuce: 10, tomato: 8, onion: 8 };

export function stackHeight(stack) {
  return stack.reduce((a, n) => a + (LAYER_H[n] || 10), 0);
}

// The star of every screenshot: a full burger, bottom bun first, steam rising.
export function drawBurger(ctx, stack, x, y, s = 1, opts = {}) {
  const { steam = 0, t = 0, shine = 1, cook = 1 } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // plate shadow + plate
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ellipse(ctx, 0, 10, 88, 15);
  ctx.fill();
  const pg = ctx.createLinearGradient(0, -10, 0, 14);
  pg.addColorStop(0, '#e8e2d4');
  pg.addColorStop(0.55, '#dcd5c5');
  pg.addColorStop(1, '#b9b1a1');
  ctx.fillStyle = pg;
  ellipse(ctx, 0, 0, 88, 19);
  ctx.fill();
  ctx.strokeStyle = 'rgba(96,86,72,0.55)';
  ctx.lineWidth = 2;
  ellipse(ctx, 0, 0, 85.5, 17.5);
  ctx.stroke();

  let cursor = -stackHeight(stack) / 2 + 10;
  for (let i = 0; i < stack.length; i++) {
    const name = stack[i];
    cursor += (LAYER_H[name] || 10) / 2;
    const isBottom = name === 'bun' && i === 0;
    if (isBottom) drawBunBottom(ctx, 0, cursor, 1);
    else drawIngredient(ctx, name, 0, cursor, 1.05, t, cook);
    cursor += (LAYER_H[name] || 10) / 2;
  }

  if (shine > 0) {
    ctx.save();
    ctx.globalAlpha = 0.25 * shine;
    ctx.fillStyle = '#fff';
    ellipse(ctx, -34, -stackHeight(stack) / 2 + 6, 9, 4, -0.5);
    ctx.fill();
    ctx.restore();
  }
  if (steam > 0) drawSteam(ctx, 0, -stackHeight(stack) / 2 - 14, steam, t, 60);
  ctx.restore();
}

/* ---------------------------------- atmosphere ---------------------------------- */

export function drawSteam(ctx, x, y, strength, t, spread = 40) {
  if (strength <= 0) return;
  const baseW = spread * 0.42;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // one continuous tapered plume: dense at the food, thinning as it rises and
  // leaning toward the hood side so the shape reads as extraction, not smoke puffs
  for (let i = 0; i < 11; i++) {
    const q = i / 10;
    const lean = -q * q * 26;
    const sway = Math.sin(t * 1.1 + q * 4.2) * (2 + q * 7);
    const cy = y + 3 - q * 78;
    const cx = x + lean + sway;
    const rx = baseW * (1.05 - q * 0.5) + 4;
    const ry = rx * (0.62 + (i % 3) * 0.07);
    const a = Math.pow(1 - q, 1.1) * 0.19 * strength;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 1.7);
    g.addColorStop(0, `rgba(255,238,212,${a})`);
    g.addColorStop(0.4, `rgba(255,228,192,${a * 0.45})`);
    g.addColorStop(1, 'rgba(255,222,184,0)');
    ctx.fillStyle = g;
    ellipse(ctx, cx, cy, rx * 1.7, ry * 1.7);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFlame(ctx, x, y, s, t, seed = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const f = Math.sin(t * (7 + i * 2.3) + seed * 2 + i) * 0.5 + 0.5;
    const h = 22 + f * 20 - i * 5;
    const g = ctx.createLinearGradient(0, 0, 0, -h);
    g.addColorStop(0, i === 0 ? 'rgba(255,120,40,0.9)' : 'rgba(255,200,90,0.85)');
    g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-8 + i, 0);
    ctx.quadraticCurveTo(-10, -h * 0.6, 0, -h);
    ctx.quadraticCurveTo(10, -h * 0.55, 7 - i, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function emberField(ctx, embers, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const e of embers) {
    const p = (t * e.speed + e.phase) % 1;
    const y = e.y - p * 120;
    const x = e.x + Math.sin(p * 6 + e.phase * 9) * 14;
    ctx.globalAlpha = (1 - p) * 0.75;
    ctx.fillStyle = e.color;
    ellipse(ctx, x, y, e.r, e.r);
    ctx.fill();
  }
  ctx.restore();
}

/* ---------------------------------- ticket cards ---------------------------------- */

const SHORT = {
  bun: 'BUN', patty: 'PATTY', cheese: 'CHEESE', lettuce: 'LET', tomato: 'TOM', onion: 'ONION',
};

const DOT = {
  bun: '#c98a45', patty: '#6b3a26', cheese: '#e8a92c', lettuce: '#4e9435', tomato: '#cf3a2c', onion: '#a07bb5',
};

export function drawTicket(ctx, order, x, y, w, h, t, opts = {}) {
  const { hot = 0, done = false } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rrect(ctx, 4, 6, w, h, 8);
  ctx.fill();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, done ? '#d9f5cd' : COLORS.ticket);
  g.addColorStop(1, done ? '#a9d99a' : '#e6d9be');
  ctx.fillStyle = g;
  rrect(ctx, 0, 0, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,50,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // little clip at the top of the rail
  ctx.fillStyle = '#8d6a45';
  rrect(ctx, w / 2 - 9, -8, 18, 11, 3);
  ctx.fill();

  text(ctx, order.recipe.name.toUpperCase(), 12, 24, { size: 16.5, weight: 800, color: '#3d2818', letter: 1 });
  text(ctx, `$${order.recipe.price}`, w - 12, 24, { size: 17, weight: 800, color: '#2f6b3a', align: 'right' });
  ctx.fillStyle = 'rgba(90,70,50,0.3)';
  ctx.fillRect(10, 31, w - 20, 1.5);

  // the stack itself, written out bottom to top: dots carry the colour, words carry the order
  const pad = 12;
  const FONT = '800 15px Segoe UI, system-ui, sans-serif';
  let line = [];
  let lineW = 0;
  let cy = 54;
  const rows = [];
  for (const name of order.recipe.stack) {
    const label = SHORT[name] || name;
    ctx.font = FONT;
    const iw = 15 + ctx.measureText(label).width + 9;
    if (lineW + iw > w - pad * 2 && line.length) {
      rows.push([line, lineW]);
      line = [];
      lineW = 0;
    }
    line.push([name, label, iw]);
    lineW += iw;
  }
  if (line.length) rows.push([line, lineW]);

  for (const [items] of rows.slice(0, 4)) {
    let cx = pad;
    for (const [name, label] of items) {
      ctx.fillStyle = DOT[name] || '#7a5a3a';
      rrect(ctx, cx, cy - 10, 9, 9, 2.5);
      ctx.fill();
      text(ctx, label, cx + 13, cy, { size: 15, weight: 800, color: '#3f2b19', letter: 0.1 });
      ctx.font = FONT;
      cx += 15 + ctx.measureText(label).width + 9;
    }
    cy += 19;
  }

  // countdown in seconds, plus the bar — the two together make patience readable at a glance
  const frac = Math.max(0, Math.min(1, order.left / order.total));
  const tone = frac < 0.28 ? COLORS.bad : frac < 0.6 ? '#c07a1e' : '#2f6b3a';
  ctx.font = '800 15px Segoe UI, system-ui, sans-serif';
  text(ctx, `${Math.max(0, Math.ceil(order.left))}s`, w - 12, h - 15, { size: 15, weight: 800, color: tone, align: 'right' });
  text(ctx, 'PATIENCE', 12, h - 15, { size: 9.5, weight: 800, color: 'rgba(70,50,32,0.6)', letter: 1.6 });
  ctx.fillStyle = 'rgba(60,40,25,0.18)';
  rrect(ctx, 14, h - 9, w - 28, 6, 3);
  ctx.fill();
  ctx.fillStyle = frac < 0.28 ? COLORS.bad : frac < 0.6 ? COLORS.amber : '#4f9e57';
  rrect(ctx, 14, h - 9, Math.max(6, (w - 28) * frac), 6, 3);
  ctx.fill();

  if (hot > 0) {
    ctx.save();
    ctx.globalAlpha = hot * 0.8;
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 3;
    rrect(ctx, 1.5, 1.5, w - 3, h - 3, 7);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------------------------- the chef ---------------------------------- */

export function drawChef(ctx, chef, t) {
  const { x, y, facing = 1, walk = 0, carry = [], busy = 0, scale = 1 } = chef;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // contact shadow so the feet belong to the floor
  const cs = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  cs.addColorStop(0, 'rgba(0,0,0,0.5)');
  cs.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cs;
  ellipse(ctx, 0, 2, 34, 11);
  ctx.fill();

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ellipse(ctx, 0, 6, 34, 10);
  ctx.fill();

  const step = Math.sin(walk * 9) * (chef.moving ? 1 : 0);
  const bob = Math.sin(walk * 9) * (chef.moving ? 2.4 : Math.sin(t * 2.2) * 1.2);

  // legs
  ctx.fillStyle = '#1b1f26';
  rrect(ctx, -16, -34, 13, 38 + step * 3, 6);
  ctx.fill();
  rrect(ctx, 3, -34, 13, 38 - step * 3, 6);
  ctx.fill();
  ctx.fillStyle = '#2b2118';
  rrect(ctx, -18, -6 + Math.max(0, step) * 2, 18, 9, 4);
  ctx.fill();
  rrect(ctx, 2, -6 + Math.max(0, -step) * 2, 18, 9, 4);
  ctx.fill();

  // body: apron over a dark tee
  ctx.fillStyle = '#2a313a';
  rrect(ctx, -25, -88 + bob, 50, 56, 14);
  ctx.fill();
  const ag = ctx.createLinearGradient(0, -86, 0, -34);
  ag.addColorStop(0, '#f6ead6');
  ag.addColorStop(1, '#d8c6ab');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.moveTo(-20, -84 + bob);
  ctx.lineTo(20, -84 + bob);
  ctx.lineTo(23, -34 + bob);
  ctx.quadraticCurveTo(0, -26 + bob, -23, -34 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,95,70,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -80 + bob); ctx.lineTo(-15, -36 + bob);
  ctx.moveTo(14, -80 + bob); ctx.lineTo(15, -36 + bob);
  ctx.stroke();

  // cel shade down the right of the apron, warm bounce on the left
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-20, -84 + bob);
  ctx.lineTo(20, -84 + bob);
  ctx.lineTo(23, -34 + bob);
  ctx.quadraticCurveTo(0, -26 + bob, -23, -34 + bob);
  ctx.closePath();
  ctx.clip();
  const sg2 = ctx.createLinearGradient(-24, 0, 24, 0);
  sg2.addColorStop(0, 'rgba(255,196,120,0.16)');
  sg2.addColorStop(0.45, 'rgba(0,0,0,0)');
  sg2.addColorStop(1, 'rgba(40,24,14,0.28)');
  ctx.fillStyle = sg2;
  ctx.fillRect(-24, -90 + bob, 48, 68);
  ctx.fillStyle = 'rgba(90,60,40,0.18)';
  ctx.fillRect(-2, -84 + bob, 2, 52);
  ctx.restore();
  // apron pocket + stain
  ctx.fillStyle = 'rgba(160,110,70,0.25)';
  rrect(ctx, -9, -58 + bob, 18, 12, 3);
  ctx.fill();

  // arms
  ctx.strokeStyle = '#e9c9a8';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  const swing = Math.sin(walk * 9) * 6;
  const reach = busy > 0 ? 10 : 0;
  ctx.beginPath();
  ctx.moveTo(-22, -78 + bob);
  ctx.lineTo(-31 + reach * 0.4, -54 + bob + swing * (chef.moving ? 1 : 0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(22, -78 + bob);
  ctx.lineTo(31 + reach * 0.4, -54 + bob - swing * (chef.moving ? 1 : 0));
  ctx.stroke();

  // hands: pale mitts at the end of each arm so the silhouette reads as a person
  const lhx = -31 + reach * 0.4;
  const lhy = -54 + bob + swing * (chef.moving ? 1 : 0);
  const rhx = 31 + reach * 0.4;
  const rhy = -54 + bob - swing * (chef.moving ? 1 : 0);
  ctx.fillStyle = '#f0d1ae';
  ellipse(ctx, lhx, lhy, 6, 6.5);
  ctx.fill();
  ellipse(ctx, rhx, rhy, 6, 6.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,140,100,0.5)';
  ctx.lineWidth = 1;
  ellipse(ctx, lhx, lhy, 6, 6.5);
  ctx.stroke();
  ellipse(ctx, rhx, rhy, 6, 6.5);
  ctx.stroke();

  // head
  ctx.fillStyle = '#eec9a6';
  ellipse(ctx, 0, -104 + bob, 21, 22);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -104 + bob, 21, -Math.PI * 0.42, Math.PI * 0.5);
  ctx.closePath();
  ctx.fillStyle = 'rgba(60,34,20,0.16)';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ellipse(ctx, 0, -96 + bob, 18, 10);
  ctx.fill();

  // hair + toque
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath();
  ctx.arc(0, -110 + bob, 21, Math.PI * 1.05, Math.PI * 2.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fdf7ec';
  rrect(ctx, -20, -132 + bob, 40, 12, 5);
  ctx.fill();
  for (const [dx, dy, r] of [[-14, -6, 12], [0, -10, 14], [14, -6, 12]]) {
    ellipse(ctx, dx, -132 + bob + dy, r, r * 0.95);
    ctx.fill();
  }

  // eyes + brows: look toward the station they face
  const look = facing * 3;
  ctx.fillStyle = '#20161a';
  ellipse(ctx, -7 + look, -104 + bob, 2.7, 3.4);
  ctx.fill();
  ellipse(ctx, 7 + look, -104 + bob, 2.7, 3.4);
  ctx.fill();
  ctx.strokeStyle = '#2a1a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11 + look, -111 + bob); ctx.lineTo(-4 + look, -113 + bob);
  ctx.moveTo(4 + look, -113 + bob); ctx.lineTo(11 + look, -111 + bob);
  ctx.stroke();
  // mouth + blush
  ctx.strokeStyle = '#a2564e';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(look, -95 + bob, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(226,110,90,0.28)';
  ellipse(ctx, -15 + look, -98 + bob, 5, 3);
  ctx.fill();
  ellipse(ctx, 15 + look, -98 + bob, 5, 3);
  ctx.fill();

  // carried ingredients float above the tray
  for (let i = 0; i < carry.length; i++) {
    const yy = -150 + bob - i * 4;
    const xx = (i - (carry.length - 1) / 2) * 26;
    ctx.save();
    ctx.globalAlpha = 0.95;
    drawIngredient(ctx, carry[i], xx, yy, 0.34, t, 1);
    ctx.restore();
  }

  // rim light from the hood: one warm edge down the silhouette so the chef sits in the scene
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,176,96,0.4)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -104 + bob, 21, Math.PI * 0.95, Math.PI * 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-20, -76 + bob);
  ctx.quadraticCurveTo(-27, -50 + bob, -25, -28 + bob);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
