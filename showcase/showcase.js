// Renders the data-driven parts of the showcase and wires the theme controls.
(function () {
  const data = window.SANCTUARY;
  const { state, options, apply, milliseconds } = window.SanctuaryTheme;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const titles = { ...data.flavors, ...data.glazings, ...data.windows, ...data.windowModes };
  const label = (id) => titles[id]?.name ?? id[0].toUpperCase() + id.slice(1);

  /* ---------- theme ---------- */

  function set(axis, value) {
    if (state[axis] === value) return;
    state[axis] = value;
    const root = document.documentElement;
    root.classList.add('is-shifting');
    clearTimeout(set.timer);
    set.timer = setTimeout(() => root.classList.remove('is-shifting'), procession());
    apply();
    sync();
  }

  // The theme transition lasts as long as the motion token that drives it.
  const procession = () =>
    milliseconds(getComputedStyle(document.documentElement).getPropertyValue('--san-duration-procession'));

  function sync() {
    for (const button of $$('[data-set]')) {
      const [axis, value] = button.dataset.set.split(':');
      button.setAttribute('aria-pressed', String(state[axis] === value));
    }
    renderRoles();
    markRoleTones();
    $('[data-clock]').textContent = data.flavors[state.flavor].name;
  }

  document.addEventListener('click', (event) => {
    const setter = event.target.closest('[data-set]');
    if (setter) set(...setter.dataset.set.split(':'));
    const copy = event.target.closest('[data-copy]');
    if (copy) copyText(copy.dataset.copy);
    if (event.target.closest('[data-action="play"]')) play();
    const tab = event.target.closest('.tab');
    if (tab) for (const other of $$('.tab', tab.parentElement)) other.setAttribute('aria-selected', String(other === tab));
  });

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.target.matches('input, select, textarea')) return;
    const axis = { f: 'flavor', a: 'accent', g: 'glazing', w: 'window' }[event.key?.toLowerCase()];
    if (!axis) return;
    const list = options[axis];
    set(axis, list[(list.indexOf(state[axis]) + 1) % list.length]);
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text}`);
    } catch {
      toast(text);
    }
  }

  function toast(message) {
    const node = $('[data-toast]');
    node.textContent = message;
    node.classList.add('is-open');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('is-open'), 1600);
  }

  /* ---------- controls ---------- */

  function renderControls() {
    const segment = (axis) =>
      options[axis].map((id) => `<button class="seg__item" data-set="${axis}:${id}">${label(id)}</button>`).join('');
    $('[data-control="flavor"]').innerHTML = segment('flavor');
    $('[data-control="glazing"]').innerHTML = segment('glazing');
    $('[data-control="accent"]').innerHTML = options.accent
      .map((id) => `<button class="tessera" data-set="accent:${id}" title="${label(id)}" aria-label="${label(id)}" style="--c:var(--san-glass-${id})"></button>`)
      .join('');
    $('[data-control="window"]').innerHTML = options.window
      .map((id) => `<button class="lancet-btn" data-set="window:${id}" ${windowScope(id)} title="${label(id)}" aria-label="${label(id)} window"><span></span></button>`)
      .join('');
  }

  // Each preview scopes its own window.
  const windowScope = (id) => `data-san-window="${id}"`;

  /* ---------- rose window ---------- */

  function roseWindow() {
    const polar = (r, deg) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${(r * Math.cos(rad)).toFixed(2)} ${(r * Math.sin(rad)).toFixed(2)}`;
    };
    const sector = (r1, r2, from, to) =>
      `M${polar(r1, from)}A${r1} ${r1} 0 0 1 ${polar(r1, to)}L${polar(r2, to)}A${r2} ${r2} 0 0 0 ${polar(r2, from)}Z`;
    const petal = (r1, r2, at, half) =>
      `M${polar(r1, at - half)}A${r1} ${r1} 0 0 1 ${polar(r1, at + half)}Q${polar(r2 * 0.86, at + half * 0.95)} ${polar(r2, at)}Q${polar(r2 * 0.86, at - half * 0.95)} ${polar(r1, at - half)}Z`;
    const pane = (d, fill, i) => `<path class="rose__pane" d="${d}" style="fill:var(--san-${fill});--i:${i}"/>`;
    const panes = [];
    const outer = ['window-a', 'window-b', 'window-c', 'window-b'];
    for (let i = 0; i < 24; i += 1) panes.push(pane(sector(67, 92, i * 15 + 0.9, i * 15 + 14.1), outer[i % 4], i));
    for (let i = 0; i < 12; i += 1) {
      panes.push(pane(petal(31, 63, i * 30, 12.5), i % 2 ? 'window-c' : 'window-b', i + 3));
      panes.push(pane(sector(12, 28, i * 30 + 1.6, i * 30 + 28.4), i % 2 ? 'window-a' : 'window-c', i + 7));
      panes.push(`<circle class="rose__pane" r="3.4" cx="${polar(58, i * 30 + 15).split(' ')[0]}" cy="${polar(58, i * 30 + 15).split(' ')[1]}" style="fill:var(--san-glass-gilt);--i:${i}"/>`);
    }
    return `<svg viewBox="-100 -100 200 200" role="presentation">
      <defs><radialGradient id="rose-sun"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>
      <circle r="99" class="rose__stone"/><circle r="94.5" class="rose__lead"/>
      ${panes.join('')}
      <circle r="9" class="rose__pane" style="fill:var(--san-window-c);--i:2"/>
      <circle r="94.5" class="rose__sun" fill="url(#rose-sun)"/>
    </svg>`;
  }

  /* ---------- sections ---------- */

  // The hero counts what the palette ships, so it cannot drift from it.
  function renderFacts() {
    // Each fact names the palette table it counts; tones are counted on one pigment's ramp.
    const count = (fact) =>
      Object.keys(fact === 'tones' ? Object.values(data.pigments)[0].tones : data[fact]).length;
    for (const node of $$('[data-fact]')) node.textContent = count(node.dataset.fact);
    const modes = Object.values(data.windowModes).map(({ name }) => name.toLowerCase());
    $('[data-window-modes]').textContent = new Intl.ListFormat('en', { type: 'disjunction' }).format(modes);
  }

  function renderFlavors() {
    $('[data-render="flavors"]').innerHTML = options.flavor
      .map((id) => {
        const flavor = data.flavors[id];
        return `<button class="flavor" data-set="flavor:${id}" data-san-flavor="${id}">
          <span class="flavor__sky"><span class="glow"><span class="flavor__glass"></span></span></span>
          <span class="inscription">${flavor.hour}</span>
          <span class="flavor__name">${flavor.name}</span>
          <span class="flavor__blurb">${flavor.blurb}</span>
          <span class="flavor__stack"><i></i><i></i><i></i><i></i><i></i><b>Aa</b></span>
        </button>`;
      })
      .join('');
  }

  function renderPigments() {
    $('[data-render="pigments"]').innerHTML = Object.entries(data.pigments)
      .map(([id, pigment]) => {
        const tones = Object.entries(pigment.tones)
          .map(([tone, hex]) => `<button class="tone" data-copy="${hex}" data-tone="${tone}" data-hex="${hex}" style="background:${hex}" title="${id} ${tone} · ${hex}"><span>${tone}</span></button>`)
          .join('');
        return `<div class="ramp" data-pigment="${id}">
          <button class="ramp__name" data-set="accent:${id}"><b>${label(id)}</b><span>${pigment.note}</span></button>
          <div class="ramp__tones">${tones}</div>
        </div>`;
      })
      .join('');
  }

  function markRoleTones() {
    const colors = data.flavors[state.flavor].colors;
    for (const ramp of $$('.ramp')) {
      const base = colors[`glass-${ramp.dataset.pigment}`].hex;
      for (const tone of $$('.tone', ramp)) tone.classList.toggle('is-role', tone.dataset.hex === base);
    }
  }

  const ROLES = [
    'surface-sunken', 'surface', 'surface-raised-1', 'surface-raised-2', 'surface-raised-3', 'surface-raised-4',
    'lead-soft', 'lead', 'lead-strong', 'lead-came', 'text-disabled', 'text-subtle', 'text-muted', 'text',
  ];

  function renderRoles() {
    const colors = data.flavors[state.flavor].colors;
    $('[data-render="roles"]').innerHTML = ROLES.map(
      (role) => `<button class="role" data-copy="${colors[role].hex}">
        <i style="background:var(--san-${role})"></i><b>${role}</b><span>${colors[role].hex}</span>
      </button>`,
    ).join('');
  }

  function renderGlazings() {
    $('[data-render="glazings"]').innerHTML = options.glazing
      .map((id) => `<article class="glazing" data-san-glazing="${id}">
          <div class="glazing__stage">
            <button class="btn btn--glazed">Glazed button</button>
            <span class="chip chip--glazed">Chip</span>
            <label class="switch"><input type="checkbox" checked><span class="switch__track"></span></label>
            <div class="glazing__pane">A pane of ${data.glazings[id].name.toLowerCase()}</div>
          </div>
          <h3>${data.glazings[id].name}</h3>
          <p>${data.glazings[id].note}</p>
          <button class="btn btn--outline btn--sm" data-set="glazing:${id}">Use ${data.glazings[id].name}</button>
        </article>`)
      .join('');
  }

  function renderWindows() {
    const modes = data.windowModes;
    const glass = '<span class="glow"><span class="window__lead"><span class="window__glass"></span></span></span>';
    $('[data-render="windows"]').innerHTML = options.window
      .map((id) => `<button class="window" data-set="window:${id}" ${windowScope(id)}>
          ${glass}<b>${modes[id].name}</b><span>${modes[id].source}</span><small>${modes[id].note}</small>
        </button>`)
      .join('');
    // Named windows are fixed gradients, shown here as they would be placed by hand.
    $('[data-render="named-windows"]').innerHTML = Object.entries(data.windows)
      .map(([id, info]) => `<button class="window" data-copy="var(--san-window-${id})" style="--san-window:var(--san-window-${id})">
          ${glass}<b>${info.name}</b><span>${info.stops.join(' · ')}</span><small>${info.note}</small>
        </button>`)
      .join('');
  }

  function renderLumen() {
    // The stone stops brightening at level 4, where Lauds already reaches white; level 5 only deepens the umbra.
    const surfaces = ['surface', 'surface-raised-1', 'surface-raised-2', 'surface-raised-3', 'surface-raised-4', 'surface-raised-4'];
    const label = (surface, level) => (level === 5 ? 'raised-4, deeper umbra' : surface.replace('surface-', ''));
    $('[data-render="lumen"]').innerHTML = surfaces
      .map((surface, level) => `<div class="tile" style="background:var(--san-${surface});box-shadow:var(--san-elevation-${level})"><b>Lumen ${level}</b><span>${label(surface, level)}</span></div>`)
      .join('');
  }

  const TYPE = [
    ['display-lg', 'Lux aeterna'], ['display-sm', 'Light through glass'], ['headline-md', 'The nave at dusk'],
    ['title-lg', 'Title large, for cards and dialogs'], ['body-lg', 'Body large. Stone is quiet so that colour can speak.'],
    ['body-md', 'Body medium, the default running text of the system.'], ['label-lg', 'Label large · buttons and tabs'],
    ['inscription', 'Inscription · carved overlines'], ['code-md', 'const glass = pigment.cobalt[300];'],
  ];

  function renderFoundations() {
    $('[data-render="type"]').innerHTML = TYPE.map(
      ([role, sample]) => `<div class="specimen__row"><code>${role}</code><span class="${role === 'inscription' ? 'inscription' : ''}" style="font:var(--san-type-${role});letter-spacing:var(--san-type-${role}-tracking)">${sample}</span></div>`,
    ).join('');
    $('[data-render="shapes"]').innerHTML =
      ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'].map((r) => `<div class="shape" style="border-radius:var(--san-radius-${r})"><span>${r}</span></div>`).join('') +
      ['lancet', 'ogive'].map((s) => `<div class="shape shape--arch" style="clip-path:var(--san-shape-${s})"><span>${s}</span></div>`).join('');
    $('[data-render="space"]').innerHTML = ['1', '2', '3', '4', '6', '8', '12', '16']
      .map((s) => `<div class="space"><code>${s}</code><i style="width:var(--san-space-${s})"></i></div>`)
      .join('');
    $('[data-render="motion"]').innerHTML = [['standard', 'slow'], ['enter', 'slow'], ['exit', 'slow'], ['standard', 'procession']]
      .map(([ease, duration]) => `<div class="motion"><code>ease-${ease} · ${duration}</code><div class="motion__track"><i style="transition:translate var(--san-duration-${duration}) var(--san-ease-${ease})"></i></div></div>`)
      .join('');
    const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    $('[data-render="ansi"]').innerHTML = [...names, ...names.map((n) => `bright-${n}`)]
      .map((n) => `<i title="${n}" style="background:var(--san-ansi-${n})"></i>`)
      .join('');
  }

  function play() {
    for (const track of $$('.motion__track')) track.classList.toggle('is-played');
  }

  renderControls();
  for (const rose of $$('[data-rose]')) rose.innerHTML = roseWindow();
  renderFacts();
  renderFlavors();
  renderPigments();
  renderGlazings();
  renderWindows();
  renderLumen();
  renderFoundations();
  sync();
})();
