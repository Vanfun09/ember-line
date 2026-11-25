// Tuning, palette and the menu. Every number a designer would want to touch lives here.

export const W = 1280;
export const H = 720;

export const COLORS = {
  ink: '#0b0809',
  coal: '#14100f',
  wall: '#221a18',
  tileLine: '#2e2320',
  wood: '#3a2418',
  woodLit: '#54331f',
  copper: '#b9713c',
  copperLit: '#e79a5c',
  brass: '#f0c073',
  cream: '#fff3dc',
  amber: '#ffb347',
  ember: '#ff6a34',
  flame: '#ffd166',
  smoke: 'rgba(220,205,190,0.20)',
  bun: '#dda05a',
  bunLit: '#f3c07d',
  bunDark: '#a36c33',
  pattyRaw: '#b0616a',
  patty: '#6b3a26',
  pattyChar: '#331a12',
  cheese: '#ffc247',
  lettuce: '#77c257',
  lettuceDark: '#4d9138',
  tomato: '#e04a3c',
  onion: '#c9a7d6',
  plate: '#f4efe6',
  steel: '#8e9aa3',
  steelDark: '#5a656d',
  neon: '#59e0c8',
  good: '#8fe07a',
  bad: '#ff6b5e',
  ticket: '#fbf3e2',
};

// Stations are a fixed line of counters; the chef slides between them.
export const LINE = {
  y: 470,
  counterTop: 470,
  counterBottom: 560,
  crateX: 175,
  boardX: 400,
  grillX: 645,
  passX: 890,
  windowX: 1120,
  walkMin: 120,
  walkMax: 1170,
};

export const GRILL = { slots: 4, x: 645, y: 452, spacing: 62, cookTime: 6.5, burnTime: 11.5 };

export const INGREDIENTS = {
  bun:      { name: 'bun',      label: 'Bun',      color: COLORS.bun,      veg: false, cookable: false },
  patty:    { name: 'patty',    label: 'Patty',    color: COLORS.pattyRaw, veg: false, cookable: true },
  cheese:   { name: 'cheese',   label: 'Cheese',   color: COLORS.cheese,   veg: false, cookable: false },
  lettuce:  { name: 'lettuce',  label: 'Lettuce',  color: COLORS.lettuce,  veg: true,  cookable: false },
  tomato:   { name: 'tomato',   label: 'Tomato',   color: COLORS.tomato,   veg: true,  cookable: false },
  onion:    { name: 'onion',    label: 'Onion',    color: COLORS.onion,    veg: true,  cookable: false },
};

// Menu: stacked bottom-up. Judge-visible text on the tickets uses these names.
export const MENU = [
  { id: 'classic',  name: 'Classic',      price: 8,  stack: ['bun', 'patty', 'cheese', 'bun'] },
  { id: 'garden',   name: 'Garden',       price: 7,  stack: ['bun', 'lettuce', 'tomato', 'onion', 'bun'] },
  { id: 'double',   name: 'Double Ember', price: 12, stack: ['bun', 'patty', 'cheese', 'patty', 'bun'] },
  { id: 'stack',    name: 'Night Stack',  price: 11, stack: ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'bun'] },
];

export const SHIFT = { seconds: 150, ticketTime: 62, spawnEvery: 9.5, maxTickets: 3 };

export const CARRY_MAX = 3;
export const CHOP_TIME = 0.85;
export const MOVE_SPEED = 520;

export const SHOT = new URLSearchParams(location.search).get('shot');
