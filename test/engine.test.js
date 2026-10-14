import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { oklchToHex, hexToOklch, contrast } from '../src/color.js';
import { FLAVORS, PIGMENTS, TONES, WINDOW_TONES, buildPalette, harmony } from '../src/palette.js';
import { buildTokens, flatten, resolveHex } from '../src/tokens.js';
import { emitCss } from '../src/emit/css.js';
import { emitPorts } from '../src/emit/ports.js';

const palette = buildPalette();
const tokens = buildTokens(palette);
const flavorIds = Object.keys(FLAVORS);
const pigmentIds = Object.keys(PIGMENTS);

test('oklch converts to the sRGB hex given in the DTCG colour module example', () => {
  assert.equal(oklchToHex([0.7016, 0.3225, 328.363]), '#ff00ff');
});

test('hex round-trips through oklch', () => {
  for (const hex of ['#000000', '#ffffff', '#3b6fd4', '#c0392b', '#f2c94c']) {
    assert.equal(oklchToHex(hexToOklch(hex)), hex);
  }
});

test('contrast matches the WCAG extremes', () => {
  assert.equal(contrast('#000000', '#ffffff'), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
});

test('every pigment has a full ramp of in-gamut, strictly darkening tones', () => {
  for (const id of pigmentIds) {
    const ramp = palette.pigments[id];
    assert.deepEqual(Object.keys(ramp).map(Number), TONES);
    let previous = 2;
    for (const tone of TONES) {
      assert.match(ramp[tone].hex, /^#[0-9a-f]{6}$/);
      // Gamut mapping must not have clipped: the hex has to decode to the same colour.
      const [l] = hexToOklch(ramp[tone].hex);
      assert.ok(Math.abs(l - ramp[tone].oklch[0]) < 0.006, `${id}.${tone} clipped`);
      assert.ok(l < previous, `${id}.${tone} is not darker than the previous tone`);
      previous = l;
    }
  }
});

test('text and accent roles meet WCAG AA against the surfaces of every flavor', () => {
  for (const flavor of flavorIds) {
    const hex = (path) => resolveHex(tokens, flavor, path);
    for (const surface of ['surface', 'surface.sunken', 'surface.raised-2']) {
      for (const text of ['text', 'text.muted', 'text.subtle']) {
        const ratio = contrast(hex(text), hex(surface));
        assert.ok(ratio >= 4.5, `${flavor}: ${text} on ${surface} is ${ratio.toFixed(2)}`);
      }
    }
    for (const id of pigmentIds) {
      const onSurface = contrast(hex(`glass.${id}`), hex('surface'));
      const onGlass = contrast(hex(`glass.${id}.on`), hex(`glass.${id}`));
      const onPane = contrast(hex(`glass.${id}.on-pane`), hex(`glass.${id}.pane`));
      assert.ok(onSurface >= 4.5, `${flavor}: glass.${id} on surface is ${onSurface.toFixed(2)}`);
      assert.ok(onGlass >= 4.5, `${flavor}: on glass.${id} is ${onGlass.toFixed(2)}`);
      assert.ok(onPane >= 4.5, `${flavor}: on-pane glass.${id} is ${onPane.toFixed(2)}`);
    }
  }
});

test('DTCG token files are structurally valid and every alias resolves', () => {
  for (const [file, tree] of Object.entries(tokens.files)) {
    for (const { path, token, type } of flatten(tree)) {
      assert.ok(type, `${file}: ${path.join('.')} has no $type`);
      for (const segment of path) {
        assert.ok(segment === '$root' || !/^\$|[{}.]/.test(segment), `${file}: bad name ${segment}`);
      }
      if (type === 'color' && typeof token.$value === 'object') {
        assert.equal(token.$value.colorSpace, 'oklch');
        assert.equal(token.$value.components.length, 3);
        assert.match(token.$value.hex, /^#[0-9a-f]{6}$/);
      }
    }
  }
  for (const flavor of flavorIds) {
    for (const { path, type } of flatten(tokens.files[`flavor/${flavor}.tokens.json`])) {
      if (type === 'color') assert.match(resolveHex(tokens, flavor, path.join('.')), /^#[0-9a-f]{6}$/);
    }
  }
});

test('the stylesheet exposes every flavor, accent, glazing and window switch', () => {
  const css = emitCss(palette, tokens);
  for (const flavor of flavorIds) assert.ok(css.includes(`[data-san-flavor="${flavor}"]`), flavor);
  for (const id of pigmentIds) assert.ok(css.includes(`[data-san-accent="${id}"]`), id);
  for (const glazing of Object.keys(palette.glazings)) {
    assert.ok(css.includes(`[data-san-glazing="${glazing}"]`), glazing);
  }
  for (const id of ['mono', 'harmonic']) assert.ok(css.includes(`[data-san-window="${id}"]`), id);
  // Named windows are fixed gradients to place by hand, not a theme-wide switch.
  for (const id of Object.keys(palette.windows)) {
    assert.ok(css.includes(`--san-window-${id}: linear-gradient(`), id);
    assert.ok(!css.includes(`[data-san-window="${id}"]`), `${id} must not be a switch`);
  }
  // Every custom property that is read must also be declared somewhere.
  const declared = new Set([...css.matchAll(/(--san-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  for (const [, name] of css.matchAll(/var\((--san-[a-z0-9-]+)/g)) {
    assert.ok(declared.has(name), `${name} is used but never declared`);
  }
});

test('a glazing declared in the palette without CSS fails the build instead of shipping silently', () => {
  const glazings = { ...palette.glazings, stained: { name: 'Stained', note: 'Not implemented.' } };
  assert.throws(() => emitCss({ ...palette, glazings }, tokens), /glazing "stained"/);
});

test('the harmonic window leads each accent with its two neighbours on the hue wheel', () => {
  assert.deepEqual(harmony('cobalt'), ['azure', 'cobalt', 'indigo']);
  // The wheel is circular: rose (3°) sits between murrey (342°) and ruby (24°).
  assert.deepEqual(harmony('ruby'), ['rose', 'ruby', 'ember']);
  assert.deepEqual(harmony('rose'), ['murrey', 'rose', 'ruby']);

  const css = emitCss(palette, tokens);
  const blockOf = (selector) => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)));
  const stops = (id) => harmony(id).map((pigment, i) => `--san-harmony-${'abc'[i]}: var(--san-pigment-${pigment}-${WINDOW_TONES[i]});`);
  for (const id of pigmentIds) {
    for (const stop of stops(id)) assert.ok(blockOf(`[data-san-accent="${id}"]`).includes(stop), `${id}: ${stop}`);
  }
  // A flavor's default accent needs its harmony too, before any accent attribute is set.
  for (const flavor of flavorIds) {
    for (const stop of stops(FLAVORS[flavor].accent)) assert.ok(blockOf(`[data-san-flavor="${flavor}"] {`).includes(stop), `${flavor}: ${stop}`);
  }
  const harmonic = blockOf('[data-san-window="harmonic"]');
  for (const stop of 'abc') assert.ok(harmonic.includes(`--san-window-${stop}: var(--san-harmony-${stop});`), stop);
  // Mono is the default and can also be set explicitly, to opt out inside a harmonic scope.
  assert.ok(blockOf('[data-san-window="mono"]').includes('--san-window-b: var(--san-accent);'));
});

test('the default flavor is declared first so that any flavor attribute on the root overrides it', () => {
  const css = emitCss(palette, tokens);
  const rootAt = css.indexOf(':root,\n[data-san-flavor=');
  assert.ok(rootAt > 0, 'default flavor block not found');
  for (const flavor of flavorIds) {
    assert.ok(css.indexOf(`[data-san-flavor="${flavor}"] {`) > rootAt, `${flavor} is declared before the default`);
  }
});

test('every port ships one theme per flavor with sixteen ANSI colours', () => {
  const ports = emitPorts(palette, tokens);
  for (const app of ['kitty', 'ghostty', 'alacritty', 'base16', 'gtk', 'hyprland']) {
    const files = Object.keys(ports).filter((file) => file.startsWith(`${app}/`));
    assert.equal(files.length, flavorIds.length, app);
  }
  for (const flavor of flavorIds) {
    const kitty = ports[`kitty/sanctuary-${flavor}.conf`];
    assert.equal([...kitty.matchAll(/^color\d+\s+#[0-9a-f]{6}$/gm)].length, 16);
  }
});

test('committed build outputs are up to date with the sources', () => {
  const script = fileURLToPath(new URL('../scripts/build.js', import.meta.url));
  execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' });
});
