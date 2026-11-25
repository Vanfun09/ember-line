// Tiny synthesised sound: no audio files, no CDN. The context only exists after the first
// gesture, so a browser that blocks autoplay simply stays silent until the player interacts.

let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return ctx;
}

export function unlock() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

export function setMuted(v) {
  muted = v;
  if (master) master.gain.value = v ? 0 : 0.22;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.5, slideTo = null) {
  const c = ensure();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export function noise(dur, gain = 0.4, hp = 800) {
  const c = ensure();
  if (!c || muted) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
}

export const sfx = {
  pick: () => tone(520, 0.07, 'triangle', 0.3),
  chop: () => noise(0.06, 0.28, 1600),
  sizzle: () => noise(0.22, 0.3, 900),
  plate: () => tone(300, 0.09, 'sine', 0.35, 220),
  cash: () => {
    tone(880, 0.09, 'square', 0.22);
    setTimeout(() => tone(1320, 0.16, 'square', 0.18), 70);
  },
  fail: () => tone(160, 0.28, 'sawtooth', 0.3, 90),
  bell: () => {
    tone(1046, 0.5, 'sine', 0.2);
    tone(1568, 0.42, 'sine', 0.1);
  },
  start: () => {
    tone(392, 0.12, 'triangle', 0.28);
    setTimeout(() => tone(523, 0.12, 'triangle', 0.28), 110);
    setTimeout(() => tone(784, 0.22, 'triangle', 0.26), 220);
  },
};
