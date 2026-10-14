// Builds the DTCG 2025.10 token trees and the resolver document from the palette.

import { FOUNDATION_FILES } from './foundation.js';
import { DEFAULT_FLAVOR, PIGMENTS, STATUS, SYNTAX, WINDOW_TONES } from './palette.js';

const GLASS_ROLES = ['$root', 'lume', 'ink', 'pane', 'on', 'on-pane'];

/** Alias to a token; a bare group name points at that group's `$root` token. */
const ref = (path, role = '$root') => `{${path}${role === '$root' ? '.$root' : `.${role}`}}`;

function dtcgColor({ oklch, hex, alpha }) {
  return { colorSpace: 'oklch', components: oklch, ...(alpha === undefined ? {} : { alpha }), hex };
}

const colorGroup = (records) =>
  Object.fromEntries(Object.entries(records).map(([key, record]) => [key, { $value: dtcgColor(record) }]));

const roleGroup = (target, roles = GLASS_ROLES) =>
  Object.fromEntries(roles.map((role) => [role, { $value: ref(target, role) }]));

function pigmentFile(palette) {
  const pigment = { $type: 'color' };
  for (const [id, ramp] of Object.entries(palette.pigments)) {
    pigment[id] = { $description: PIGMENTS[id].note, ...colorGroup(ramp) };
  }
  return { pigment };
}

// Terminal colours follow the convention that 0/8 recede and 7/15 carry text, in both schemes.
function ansi(scheme) {
  const neutrals =
    scheme === 'dark'
      ? { black: '{surface.raised-3}', white: '{text.muted}', 'bright-black': '{lead.strong}', 'bright-white': '{text.$root}' }
      : { black: '{text.muted}', white: '{lead.$root}', 'bright-black': '{text.subtle}', 'bright-white': '{lead.soft}' };
  const hues = { red: 'ruby', green: 'verdure', yellow: 'gilt', blue: 'cobalt', magenta: 'amethyst', cyan: 'viridian' };
  const tokens = {};
  for (const [name, pigment] of Object.entries(hues)) {
    tokens[name] = { $value: ref(`glass.${pigment}`) };
    tokens[`bright-${name}`] = { $value: ref(`glass.${pigment}`, 'lume') };
  }
  for (const [name, alias] of Object.entries(neutrals)) tokens[name] = { $value: alias };
  return tokens;
}

function flavorFile(flavor) {
  const { colors, roles } = flavor;
  const glass = {};
  for (const id of Object.keys(PIGMENTS)) {
    glass[id] = Object.fromEntries(
      GLASS_ROLES.map((role) => [role, { $value: `{pigment.${id}.${roles[role]}}` }]),
    );
  }
  return {
    $description: `${flavor.name} (${flavor.hour}). ${flavor.blurb}`,
    $extensions: { 'dev.sanctuary': { scheme: flavor.scheme, defaultAccent: flavor.accent } },
    surface: { $type: 'color', ...colorGroup(colors.surface) },
    text: { $type: 'color', ...colorGroup(colors.text) },
    lead: { $type: 'color', ...colorGroup(colors.lead) },
    umbra: { $type: 'color', ...colorGroup(colors.umbra) },
    scrim: { $type: 'color', $value: dtcgColor(colors.scrim) },
    glass: { $type: 'color', ...glass },
    accent: { $type: 'color', ...roleGroup(`glass.${flavor.accent}`) },
    ansi: { $type: 'color', ...ansi(flavor.scheme) },
  };
}

function semanticFile(palette) {
  const status = Object.fromEntries(
    Object.entries(STATUS).map(([name, pigment]) => [name, { $type: 'color', ...roleGroup(`glass.${pigment}`) }]),
  );
  const syntax = { $type: 'color' };
  for (const [name, target] of Object.entries(SYNTAX)) syntax[name] = { $value: `{${target}}` };
  const window = { $type: 'gradient' };
  for (const [id, { stops, note }] of Object.entries(palette.windows)) {
    window[id] = {
      $description: note,
      $value: stops.map((pigment, i) => ({ color: `{pigment.${pigment}.${WINDOW_TONES[i]}}`, position: i / (stops.length - 1) })),
    };
  }
  return { ...status, syntax, window };
}

function resolverDocument(files) {
  const sources = (prefix) =>
    Object.keys(files).filter((file) => file.startsWith(prefix)).map((file) => ({ $ref: file }));
  const contexts = (prefix) =>
    Object.fromEntries(sources(prefix).map((source) => [source.$ref.slice(prefix.length).split('.')[0], [source]]));
  return {
    name: 'Sanctuary',
    version: '2025-10-01',
    description: 'Resolves Sanctuary tokens for one flavor and one accent.',
    sets: {
      foundation: { sources: sources('foundation/') },
      pigment: { sources: sources('pigment.') },
      semantic: { sources: sources('semantic.') },
    },
    modifiers: {
      flavor: { description: 'The hour of the day.', contexts: contexts('flavor/'), default: DEFAULT_FLAVOR },
      accent: {
        description: 'The pigment that plays the accent. `flavor` keeps the default of the active flavor.',
        contexts: { flavor: [], ...contexts('accent/') },
        default: 'flavor',
      },
    },
    resolutionOrder: [
      { $ref: '#/sets/foundation' },
      { $ref: '#/sets/pigment' },
      { $ref: '#/modifiers/flavor' },
      { $ref: '#/sets/semantic' },
      { $ref: '#/modifiers/accent' },
    ],
  };
}

export function buildTokens(palette) {
  const files = { ...FOUNDATION_FILES, 'pigment.tokens.json': pigmentFile(palette) };
  for (const [id, flavor] of Object.entries(palette.flavors)) files[`flavor/${id}.tokens.json`] = flavorFile(flavor);
  for (const id of Object.keys(PIGMENTS)) {
    files[`accent/${id}.tokens.json`] = { accent: { $type: 'color', ...roleGroup(`glass.${id}`) } };
  }
  files['semantic.tokens.json'] = semanticFile(palette);
  return { files, resolver: resolverDocument(files) };
}

/** Every token in a tree, with its path and its own or inherited `$type`. */
export function flatten(tree, path = [], inherited) {
  const type = tree.$type ?? inherited;
  if ('$value' in tree) return [{ path, token: tree, type }];
  return Object.entries(tree)
    .filter(([key, value]) => (key === '$root' || !key.startsWith('$')) && typeof value === 'object')
    .flatMap(([key, value]) => flatten(value, [...path, key], type));
}

/** Custom property name for a token path. `$root` names the group itself. */
export const cssName = (path) => `--san-${path.filter((segment) => segment !== '$root').join('-')}`;

export const aliasPath = (value) =>
  typeof value === 'string' && value.startsWith('{') ? value.slice(1, -1).split('.') : null;

function find(tree, path) {
  let node = tree;
  for (const segment of path) node = node?.[segment];
  if (node && !('$value' in node) && node.$root) node = node.$root;
  return node && '$value' in node ? node : undefined;
}

/** Resolves a token (given as a dotted path) to its token object within one flavor. */
export function resolveToken(tokens, flavor, path) {
  const segments = Array.isArray(path) ? path : path.split('.');
  const trees = ['pigment.tokens.json', `flavor/${flavor}.tokens.json`, 'semantic.tokens.json'];
  const token = trees.map((file) => find(tokens.files[file], segments)).find(Boolean);
  if (!token) throw new Error(`Unknown token ${segments.join('.')} in flavor ${flavor}`);
  const alias = aliasPath(token.$value);
  return alias ? resolveToken(tokens, flavor, alias) : token;
}

export const resolveHex = (tokens, flavor, path) => resolveToken(tokens, flavor, path).$value.hex;
