#!/usr/bin/env node
// Builds every generated artefact from src/. `--check` verifies them instead of writing.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { emitCss } from '../src/emit/css.js';
import { emitPorts } from '../src/emit/ports.js';
import { DEFAULT_FLAVOR, PIGMENTS, TONES, buildPalette } from '../src/palette.js';
import { buildTokens, flatten, resolveToken } from '../src/tokens.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

/** The resolved palette as plain data, for tools that want colours without a token pipeline. */
function paletteData(palette, tokens) {
  const flavors = {};
  for (const [id, flavor] of Object.entries(palette.flavors)) {
    const colors = {};
    for (const { path, type } of flatten(tokens.files[`flavor/${id}.tokens.json`])) {
      if (type !== 'color') continue;
      const { hex, components, alpha } = resolveToken(tokens, id, path).$value;
      const name = path.filter((segment) => segment !== '$root').join('-');
      colors[name] = { hex, oklch: components, ...(alpha === undefined ? {} : { alpha }) };
    }
    const { name, hour, scheme, blurb, accent } = flavor;
    flavors[id] = { name, hour, scheme, blurb, accent, colors };
  }
  const pigments = {};
  for (const [id, ramp] of Object.entries(palette.pigments)) {
    pigments[id] = { ...PIGMENTS[id], tones: Object.fromEntries(TONES.map((tone) => [tone, ramp[tone].hex])) };
  }
  return { defaultFlavor: DEFAULT_FLAVOR, flavors, pigments, windows: palette.windows, glazings: palette.glazings };
}

function outputs() {
  const palette = buildPalette();
  const tokens = buildTokens(palette);
  const data = paletteData(palette, tokens);
  const files = { 'tokens/sanctuary.resolver.json': json(tokens.resolver) };
  for (const [file, tree] of Object.entries(tokens.files)) files[`tokens/${file}`] = json(tree);
  for (const [file, content] of Object.entries(emitPorts(palette, tokens))) files[`ports/${file}`] = content;
  files['dist/css/sanctuary.css'] = emitCss(palette, tokens);
  files['dist/palette.json'] = json(data);
  // A classic script so the showcase also works when opened straight from the file system.
  files['showcase/palette.js'] = `window.SANCTUARY = ${JSON.stringify(data)};\n`;
  return files;
}

const check = process.argv.includes('--check');
const stale = [];
const files = outputs();
for (const [file, content] of Object.entries(files)) {
  const target = join(root, file);
  if (check) {
    let current = null;
    try {
      current = readFileSync(target, 'utf8');
    } catch {
      // A missing file is stale.
    }
    if (current !== content) stale.push(file);
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

if (stale.length > 0) {
  console.error(`Stale generated files, run \`npm run build\`:\n${stale.map((file) => `  ${file}`).join('\n')}`);
  process.exit(1);
}
console.log(`${check ? 'Verified' : 'Wrote'} ${Object.keys(files).length} files.`);
