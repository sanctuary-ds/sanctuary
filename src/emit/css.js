// Emits the token stylesheet: custom properties only, no element or component rules.

import { archPolygon } from '../foundation.js';
import { DEFAULT_FLAVOR, PIGMENTS, WINDOW_TONES, harmony } from '../palette.js';
import { aliasPath, cssName, flatten } from '../tokens.js';

const THEMING = ['data-san-flavor', 'data-san-accent', 'data-san-glazing', 'data-san-window'];
const ANY_SCOPE = `:root, ${THEMING.map((attr) => `[${attr}]`).join(', ')}`;

// Custom properties are substituted where they are declared, so a value that reads another
// theming axis must be declared again on every nested theming element to pick up its context.
function scoped(attr, value) {
  const self = `[${attr}="${value}"]`;
  return `${self},\n${self} :is(${THEMING.map((a) => `[${a}]`).join(', ')}):not([${attr}])`;
}

const unit = ({ value, unit: u }) => (value === 0 ? '0' : `${value}${u}`);
const mix = (name, percent) => `color-mix(in oklch, var(--san-${name}) ${percent}%, transparent)`;

function colorValue(value) {
  const alias = aliasPath(value);
  if (alias) return `var(${cssName(alias)})`;
  const [l, c, h] = value.components;
  return `oklch(${l} ${c} ${h}${value.alpha === undefined ? '' : ` / ${value.alpha}`})`;
}

function declarations({ path, token, type }) {
  const name = cssName(path);
  const value = token.$value;
  switch (type) {
    case 'color':
      return [[name, colorValue(value)]];
    case 'dimension':
    case 'duration':
      return [[name, unit(value)]];
    case 'cubicBezier':
      return [[name, `cubic-bezier(${value.join(', ')})`]];
    case 'fontFamily':
      return [[name, value.map((family) => (/\s/.test(family) ? `"${family}"` : family)).join(', ')]];
    case 'typography': {
      const family = `var(${cssName(aliasPath(value.fontFamily))})`;
      return [
        [name, `${value.fontWeight} ${unit(value.fontSize)}/${value.lineHeight} ${family}`],
        [`${name}-tracking`, unit(value.letterSpacing)],
      ];
    }
    case 'shadow':
      return [[name, value.map((s) => `${unit(s.offsetX)} ${unit(s.offsetY)} ${unit(s.blur)} ${unit(s.spread)} ${colorValue(s.color)}`).join(', ')]];
    default:
      return [[name, String(value)]];
  }
}

const block = (selector, entries) =>
  `${selector} {\n${entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`;

const tokenEntries = (tree, keep = () => true) => flatten(tree).filter(keep).flatMap(declarations);

const transparentShadow = '0 0 0 0 transparent';

const windowGradient = ([a, b, c]) => `linear-gradient(160deg in oklch, ${a}, ${b} 55%, ${c})`;

// The default window: one pigment, from its pane through to its lume.
const monoStops = [
  ['--san-window-a', 'var(--san-accent-pane)'],
  ['--san-window-b', 'var(--san-accent)'],
  ['--san-window-c', 'var(--san-accent-lume)'],
];

// Window modes: where the three window stops come from.
const windowModeStops = {
  mono: monoStops,
  harmonic: [...'abc'].map((stop) => [`--san-window-${stop}`, `var(--san-harmony-${stop})`]),
};

// Glazing: how the accent is rendered on a filled element.
const glaze = {
  'pot-metal': [
    ['--san-glaze-bg', 'var(--san-accent)'],
    ['--san-glaze-bg-hover', 'color-mix(in oklch, var(--san-accent), var(--san-accent-lume) 55%)'],
    ['--san-glaze-fg', 'var(--san-accent-on)'],
    ['--san-glaze-border', 'transparent'],
    ['--san-glaze-sheen', 'linear-gradient(180deg, oklch(1 0 0 / 0.2), transparent 55%)'],
    ['--san-glaze-glow', transparentShadow],
    ['--san-glaze-blur', 'none'],
  ],
  flashed: [
    ['--san-glaze-bg', mix('accent', 20)],
    ['--san-glaze-bg-hover', mix('accent', 32)],
    ['--san-glaze-fg', 'var(--san-accent-ink)'],
    ['--san-glaze-border', mix('accent', 60)],
    ['--san-glaze-sheen', `linear-gradient(135deg, ${mix('accent-lume', 30)}, transparent 45%, ${mix('accent', 14)})`],
    ['--san-glaze-glow', 'var(--san-cast-sm)'],
    ['--san-glaze-blur', 'blur(var(--san-blur-md)) saturate(1.5)'],
  ],
  grisaille: [
    ['--san-glaze-bg', 'var(--san-surface-raised-2)'],
    ['--san-glaze-bg-hover', 'var(--san-surface-raised-4)'],
    ['--san-glaze-fg', 'var(--san-text)'],
    ['--san-glaze-border', 'color-mix(in oklch, var(--san-accent) 75%, var(--san-lead-strong))'],
    ['--san-glaze-sheen', 'none'],
    ['--san-glaze-glow', transparentShadow],
    ['--san-glaze-blur', 'none'],
  ],
};

function derived(states) {
  const percent = (key) => Math.round(states[key].$value * 100);
  return [
    ['--san-cast-sm', `0 0 12px -2px ${mix('accent', 45)}`],
    ['--san-cast-md', `0 0 28px -4px ${mix('accent', 50)}`],
    ['--san-cast-lg', `0 0 18px -2px ${mix('accent-lume', 40)}, 0 0 72px -8px ${mix('accent', 55)}`],
    ['--san-halo', '0 0 0 2px var(--san-surface), 0 0 0 4px var(--san-accent)'],
    ['--san-state-hover', `color-mix(in oklch, currentColor ${percent('hover')}%, transparent)`],
    ['--san-state-focus', `color-mix(in oklch, currentColor ${percent('focus')}%, transparent)`],
    ['--san-state-pressed', `color-mix(in oklch, currentColor ${percent('pressed')}%, transparent)`],
    ...monoStops,
    ['--san-window', windowGradient(['a', 'b', 'c'].map((stop) => `var(--san-window-${stop})`))],
    ...glaze['pot-metal'],
  ];
}


const windowTones = (pigments) => pigments.map((pigment, i) => `var(--san-pigment-${pigment}-${WINDOW_TONES[i]})`);

// Declared wherever the accent is, so the harmonic window can follow it.
const harmonyStops = (accent) => windowTones(harmony(accent)).map((value, i) => [`--san-harmony-${'abc'[i]}`, value]);

export function emitCss(palette, tokens) {
  const { files } = tokens;
  const foundation = Object.keys(files).filter((file) => file.startsWith('foundation/'));
  // Elevation reads the flavor's umbra, so it is declared with the flavor, not on :root.
  const isElevation = ({ path }) => path[0] === 'elevation';
  const semantic = tokenEntries(files['semantic.tokens.json'], ({ type }) => type === 'color');
  const elevation = tokenEntries(files['foundation/elevation.tokens.json'], isElevation);

  const out = [
    '/* Sanctuary design tokens. Generated by scripts/build.js; do not edit by hand. */\n',
    block(':root', [
      ...foundation.flatMap((file) => tokenEntries(files[file], (entry) => !isElevation(entry))),
      ['--san-shape-lancet', archPolygon(38)],
      ['--san-shape-ogive', archPolygon(100)],
      ...tokenEntries(files['pigment.tokens.json']),
      // Named windows are fixed gradients to place by hand; they do not follow the accent.
      ...Object.entries(palette.windows).map(([id, { stops }]) => [`--san-window-${id}`, windowGradient(windowTones(stops))]),
    ]),
  ];

  // The default flavor shares :root's specificity with every flavor attribute, so it must come first.
  const byDefaultFirst = ([a], [b]) => (b === DEFAULT_FLAVOR) - (a === DEFAULT_FLAVOR);
  for (const [id, flavor] of Object.entries(palette.flavors).sort(byDefaultFirst)) {
    const selector = `${id === DEFAULT_FLAVOR ? ':root,\n' : ''}[data-san-flavor="${id}"]`;
    out.push(`/* ${flavor.name}: ${flavor.hour} */`);
    out.push(block(selector, [['color-scheme', flavor.scheme], ...tokenEntries(files[`flavor/${id}.tokens.json`]), ...semantic, ...harmonyStops(flavor.accent), ...elevation]));
  }

  out.push('/* Accents */');
  for (const id of Object.keys(PIGMENTS)) {
    out.push(block(scoped('data-san-accent', id), [...tokenEntries(files[`accent/${id}.tokens.json`]), ...harmonyStops(id)]));
  }

  out.push('/* Light derived from the active flavor and accent. Pot-metal is the default glazing. */');
  out.push(block(ANY_SCOPE, derived(files['foundation/elevation.tokens.json'].state)));
  for (const id of Object.keys(palette.glazings)) {
    if (!glaze[id]) throw new Error(`No CSS is defined for glazing "${id}"; add it to the glaze table in src/emit/css.js.`);
    out.push(block(scoped('data-san-glazing', id), glaze[id]));
  }

  out.push('/* Window: the cast light is one pigment (mono, the default) or the accent with its neighbours. */');
  for (const id of Object.keys(palette.windowModes)) {
    if (!windowModeStops[id]) throw new Error(`No CSS is defined for window mode "${id}"; add it to the window mode table in src/emit/css.js.`);
    out.push(block(scoped('data-san-window', id), windowModeStops[id]));
  }
  return out.join('\n');
}
