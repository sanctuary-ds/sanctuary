import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (file) => readFileSync(new URL(`../showcase/${file}`, import.meta.url), 'utf8');

// Runs theme.js as the browser would, against an in-memory page and storage.
function loadTheme({ search = '', saved } = {}) {
  const store = new Map(saved ? [['sanctuary:showcase', JSON.stringify(saved)]] : []);
  const page = {
    URLSearchParams,
    location: { search },
    document: { documentElement: { dataset: {} } },
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
    },
  };
  page.window = page;
  runInNewContext(read('palette.js'), page);
  runInNewContext(read('theme.js'), page);
  const stored = () => JSON.parse(store.get('sanctuary:showcase') ?? 'null');
  return { root: page.document.documentElement, theme: page.SanctuaryTheme, stored };
}

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
  assert.ok(opened > 0 && !css.slice(opened, at).includes('\n}\n'), 'html.is-shifting must sit inside a no-preference media query');
});
