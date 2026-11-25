// Ember Line — entry builder (Node 22, standard library only).
//
// The game is the game/ folder beside this file: plain static files a desktop browser opens
// offline, no library under game/ and no network request at all. This program stages what the
// judge reads into the output directory (MAKEFUN_OUTPUT_DIR here, /output in the grader):
//
//   game/            copied as is
//   screenshots/     copied as is; the first by name is the cover
//   dossier.json     written by the vendored make.fun library, from the two folders above
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve it with `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own limits. Only text_max_bytes shapes the bytes it reads; the rest refuse here an
// entry the scorer would refuse anyway, with a message that says which cap was hit.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(why: string): never {
  console.error(`main.ts: ${why}`);
  process.exit(1);
}

function sizeOf(path: string): number {
  if (!existsSync(path)) return 0;
  const st = statSync(path);
  if (!st.isDirectory()) return st.size;
  let total = 0;
  for (const entry of readdirSync(path)) total += sizeOf(join(path, entry));
  return total;
}

function countFiles(path: string): number {
  if (!existsSync(path)) return 0;
  const st = statSync(path);
  if (!st.isDirectory()) return 1;
  let total = 0;
  for (const entry of readdirSync(path)) total += countFiles(join(path, entry));
  return total;
}

function longestPath(path: string, base = ''): string {
  let worst = base;
  for (const entry of readdirSync(path)) {
    const rel = base ? `${base}/${entry}` : entry;
    const full = join(path, entry);
    if (statSync(full).isDirectory()) {
      const deeper = longestPath(full, rel);
      if (deeper.length > worst.length) worst = deeper;
    } else if (rel.length > worst.length) {
      worst = rel;
    }
  }
  return worst;
}

// A stale run must not leave a file the scorer would read but this build never wrote.
for (const stale of ['game', 'screenshots', 'dossier.json']) {
  rmSync(join(OUT, stale), { recursive: true, force: true });
}
mkdirSync(OUT, { recursive: true });

const gameDir = join(ROOT, 'game');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing: the entry has no game to play');

const shotsDir = join(ROOT, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort()
  : [];
if (shots.length < 3 || shots.length > CAPS.screenshots.max) {
  fail(`screenshots/: ${shots.length} images, the entry needs at least 3 and at most ${CAPS.screenshots.max}`);
}
for (const name of shots) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > CAPS.screenshots.max_bytes) {
    fail(`screenshots/${name} is ${bytes} bytes, over the ${CAPS.screenshots.max_bytes}-byte cap`);
  }
}

const gameFiles = countFiles(gameDir);
if (gameFiles > CAPS.game_max_files) fail(`game/: ${gameFiles} files, over the ${CAPS.game_max_files}-file cap`);
const gameBytes = sizeOf(gameDir);
if (gameBytes > CAPS.game_max_bytes) fail(`game/: ${gameBytes} bytes, over the ${CAPS.game_max_bytes}-byte cap`);
const deepest = longestPath(gameDir);
if (deepest.length > CAPS.game_path_max_bytes) {
  fail(`game/${deepest} is ${deepest.length} bytes as a path, over the ${CAPS.game_path_max_bytes}-byte cap`);
}

cpSync(gameDir, join(OUT, 'game'), { recursive: true });
mkdirSync(join(OUT, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(OUT, 'screenshots'), { recursive: true });

writeFileSync(join(OUT, 'dossier.json'), buildDossier(OUT, CAPS));

console.log(
  `main.ts: staged ${gameFiles} game files (${gameBytes} bytes), ${shots.length} screenshots ` +
    `(cover ${shots[0]}), dossier.json written to ${join(OUT, 'dossier.json')}`,
);
