import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../showcase/${file}`, import.meta.url), 'utf8');

test('the slow theme transition only runs when the user allows motion', () => {
  const css = read('showcase.css');
  const at = css.indexOf('html.is-shifting');
  assert.ok(at > 0, 'theme transition rule not found');
  const opened = css.lastIndexOf('@media (prefers-reduced-motion: no-preference)', at);
  assert.ok(opened > 0 && !css.slice(opened, at).includes('\n}\n'), 'html.is-shifting must sit inside a no-preference media query');
});
