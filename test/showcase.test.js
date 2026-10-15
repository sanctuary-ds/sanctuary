import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (file) => readFileSync(new URL(`../showcase/${file}`, import.meta.url), 'utf8');

// Storage that starts out holding `saved` under whichever single key theme.js uses,
// so the tests do not repeat that key.
function memoryStorage(saved) {
  let key = null;
  let value = saved ? JSON.stringify(saved) : null;
  const claim = (name) => {
    key ??= name;
    assert.equal(name, key, 'theme.js keeps the theme under one storage key');
  };
  return {
    storage: {
      getItem: (name) => (claim(name), value),
      setItem: (name, next) => {
        claim(name);
        value = String(next);
      },
    },
    stored: () => JSON.parse(value ?? 'null'),
  };
}

// Runs theme.js as the browser would, against an in-memory page and storage.
function loadTheme({ search = '', saved } = {}) {
  const { storage, stored } = memoryStorage(saved);
  const page = {
    URLSearchParams,
    location: { search },
    document: { documentElement: { dataset: {} } },
    localStorage: storage,
  };
  page.window = page;
  runInNewContext(read('palette.js'), page);
  runInNewContext(read('theme.js'), page);
  return { root: page.document.documentElement, theme: page.SanctuaryTheme, stored };
}

// Index just past the brace that closes the block opened at `start`; comments and strings in
// the showcase CSS contain no braces, so counting them is enough.
function blockEnd(css, start) {
  let depth = 0;
  for (let i = start; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}' && --depth === 0) return i + 1;
  }
  return css.length;
}

test('the showcase offers exactly the window modes the palette publishes', () => {
  const { theme } = loadTheme();
  const data = JSON.parse(readFileSync(new URL('../dist/palette.json', import.meta.url), 'utf8'));
  assert.deepEqual([...theme.options.window], Object.keys(data.windowModes));
});

test('every hero fact in the showcase has a count to show', () => {
  const { theme } = loadTheme();
  const counted = [...Object.keys(theme.options), 'tones'];
  const facts = [...read('index.html').matchAll(/data-fact="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(facts.length > 0, 'no hero facts found');
  for (const fact of facts) assert.ok(counted.includes(fact), `${fact} has no count`);
});

test('the showcase loads exactly the fonts the palette data lists', () => {
  const data = JSON.parse(readFileSync(new URL('../dist/palette.json', import.meta.url), 'utf8'));
  const families = Object.values(data.fonts)
    .map(({ family, weights }) => `family=${family.replaceAll(' ', '+')}:wght@${weights.join(';')}`)
    .sort();
  const expected = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
  assert.ok(read('index.html').includes(`href="${expected}"`), `index.html should load ${expected}`);
});

const saved = { flavor: 'vespers', accent: 'amber', glazing: 'flashed', window: 'harmonic' };

test('a shared link previews its theme without replacing the saved one', () => {
  const { root, stored } = loadTheme({ search: '?flavor=lauds&accent=ruby', saved });
  assert.equal(root.dataset.sanFlavor, 'lauds');
  assert.equal(root.dataset.sanAccent, 'ruby');
  assert.equal(root.dataset.sanGlazing, 'flashed', 'axes missing from the link keep the saved value');
  assert.deepEqual(stored(), saved);
});

test('without a link the saved theme is restored, and a later change is saved', () => {
  const { root, theme, stored } = loadTheme({ saved });
  assert.equal(root.dataset.sanFlavor, 'vespers');
  assert.equal(root.dataset.sanWindow, 'harmonic');
  theme.state.flavor = 'matins';
  theme.apply();
  assert.equal(stored().flavor, 'matins');
});

test('a change made after opening a shared link is saved', () => {
  const { theme, stored } = loadTheme({ search: '?flavor=lauds', saved });
  theme.state.accent = 'verdure';
  theme.apply();
  assert.deepEqual(stored(), { ...saved, flavor: 'lauds', accent: 'verdure' });
});

test('the slow theme transition only runs when the user allows motion', () => {
  const css = read('showcase.css');
  const at = css.indexOf('html.is-shifting');
  assert.ok(at > 0, 'theme transition rule not found');
  const opened = css.lastIndexOf('@media (prefers-reduced-motion: no-preference)', at);
  assert.ok(opened > 0, 'no no-preference media query before the theme transition');
  assert.ok(at < blockEnd(css, css.indexOf('{', opened)), 'html.is-shifting must sit inside the no-preference media query');
});
