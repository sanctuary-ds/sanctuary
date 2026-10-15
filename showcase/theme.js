// Applies the saved theme before first paint. Shared with showcase.js through window.SanctuaryTheme.
(function () {
  const KEY = 'sanctuary:showcase';
  const data = window.SANCTUARY;
  const root = document.documentElement;
  const options = {
    flavor: Object.keys(data.flavors),
    accent: Object.keys(data.pigments),
    glazing: Object.keys(data.glazings),
    window: Object.keys(data.windowModes),
  };

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    // Storage is unavailable or corrupt: fall back to the defaults.
  }

  // A query string such as ?flavor=lauds&accent=ruby wins over the saved theme, for shareable links.
  const query = new URLSearchParams(location.search);
  const pick = (axis, fallback) =>
    [query.get(axis), saved[axis], fallback].find((value) => options[axis].includes(value));
  const flavor = pick('flavor', data.defaultFlavor);
  const state = {
    flavor,
    accent: pick('accent', data.flavors[flavor].accent),
    glazing: pick('glazing', data.defaultGlazing),
    window: pick('window', data.defaultWindow),
  };

  function apply({ persist = true } = {}) {
    root.dataset.sanFlavor = state.flavor;
    root.dataset.sanAccent = state.accent;
    root.dataset.sanGlazing = state.glazing;
    root.dataset.scheme = data.flavors[state.flavor].scheme;
    root.dataset.sanWindow = state.window;
    if (!persist) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Persisting is best effort.
    }
  }

  // A shared link previews a look; only the visitor's own changes replace their saved theme.
  apply({ persist: !Object.keys(options).some((axis) => query.has(axis)) });
  // CSS durations are written in ms or s. Without a value there is no transition to wait for.
  function milliseconds(value) {
    const text = value.trim();
    const amount = parseFloat(text);
    if (Number.isNaN(amount)) return 0;
    return text.endsWith('ms') ? amount : amount * 1000;
  }

  window.SanctuaryTheme = { state, options, apply, milliseconds };
})();
