# Sanctuary

A design system of stone, glass, lead and light: the chiaroscuro of a Gothic nave and the color its windows throw on the floor. It ships as design tokens first, so the same palette can theme a web component library, a terminal and a window manager.

## Quick path

1. Open `showcase/index.html` in a browser (no server or build needed).
2. Switch **flavor**, **accent** and **glazing** in the header, or press `F`, `A`, `G`. `W` toggles the window setting.
3. To change the system, edit `src/`, then run `pnpm run build` and `pnpm test`.

Share a specific look with a query string: `showcase/index.html?flavor=lauds&accent=ruby&glazing=flashed&window=harmonic`.

## The three axes

| Axis | Values | What it changes |
|------|--------|-----------------|
| Flavor | `lauds` (dawn, light), `vespers` (dusk), `compline` (night, default), `matins` (deep night) | Stone, ink, lead and shadow. Every pigment is re-toned to stay legible. |
| Accent | `ruby` `ember` `amber` `gilt` `verdure` `viridian` `azure` `cobalt` `indigo` `amethyst` `murrey` `rose` | Which pigment does the precise work: actions, focus, selection. |
| Glazing | `pot-metal` (solid), `flashed` (translucent, glowing), `grisaille` (line only) | How the accent is rendered on a filled element. |

```html
<html data-san-flavor="vespers" data-san-accent="amber" data-san-glazing="flashed">
```

One secondary setting, `data-san-window`, shapes the light that is cast (gradients, glows, heroes). It always follows the accent: `mono` (default) uses that pigment alone, `harmonic` leads it with its two neighbors on the hue wheel.

Any element can carry these attributes, so a card can sit in another flavor or accent than its page.

## What is in the repository

| Path | Contents | Edited by hand |
|------|----------|----------------|
| `src/` | The source of truth: color maths, palette, foundations, emitters | Yes |
| `tokens/` | DTCG 2025.10 token files and a resolver document | No, generated |
| `dist/` | `css/sanctuary.css` (custom properties) and `palette.json` | No, generated |
| `ports/` | Themes for kitty, Ghostty, Alacritty, base16, GTK CSS (Waybar) and Hyprland | No, generated |
| `showcase/` | The interactive preview | Yes, except `palette.js` |
| `docs/` | Design language, architecture, token reference, ecosystem plan | Yes |

## Commands

| Command | Result |
|---------|--------|
| `pnpm run build` | Regenerates `tokens/`, `dist/`, `ports/` and `showcase/palette.js` |
| `pnpm run check` | Fails if any generated file is stale |
| `pnpm test` | Color maths, WCAG AA contrast for every flavor, DTCG validity, cascade order, ports |

There are no dependencies. The tools run on Node 22 or later; development uses Node 24, which pnpm downloads for the project when it is missing (`devEngines.runtime` in `package.json`).

## Read next

- [Design language](docs/design-language.md): the idea, the materials and the rules.
- [Architecture](docs/architecture.md): token tiers, the build pipeline and the decisions behind them.
- [Token reference](docs/tokens.md): every group and its custom properties.
- [Ecosystem](docs/ecosystem.md): the planned GitHub organization, the Lit library and ports.

## Status

`0.1.0`, the foundation.

## License

[MIT](LICENSE). The fonts used by the showcase are not part of Sanctuary and keep their own licenses.
