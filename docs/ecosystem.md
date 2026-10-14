# Ecosystem

This repository is the seed of the [`sanctuary-ds`](https://github.com/sanctuary-ds) GitHub organisation; packages publish under the `@sanctuary-ds` npm scope. It holds the one thing every other module depends on: the palette and tokens. This page proposes how the rest should be split. Nothing here exists yet except the first row.

## Proposed repositories

| Repository | Contents | Depends on | Status |
|------------|----------|-----------|--------|
| `sanctuary` (this one) | Token engine, DTCG tokens, stylesheet, palette, showcase, design docs | Nothing | Founded |
| `elements` | The Lit web component library (`<san-button>`, ...) | `sanctuary` tokens | Planned |
| `ports` | One directory or repository per application theme | `palette.json` | Seeded in `ports/` here |
| `website` | Documentation site and the public showcase | `sanctuary`, `elements` | Planned |
| `.github` | Organisation profile, contribution guide, issue templates | Nothing | Planned |

Keep ports in this repository until there are enough of them, with enough outside contributors, to justify the overhead of separate repositories. Splitting early costs more than it returns.

## Web components with Lit

The stylesheet is already shaped for Shadow DOM: custom properties inherit through shadow boundaries, so components need no theme provider.

| Rule | Reason |
|------|--------|
| Components read semantic and light tokens only (`--san-accent`, `--san-glaze-*`, `--san-surface-*`) | A pigment read directly ignores the flavor |
| Each component exposes its own tier-5 tokens (`--san-button-radius`) that default to system tokens | Local overrides without forking |
| Theming attributes go on the host or any ancestor (`data-san-accent="ruby"`) | The same switch works for pages and for single components |
| Glazing is a system axis, not a per-component `variant` | One attribute restyles every filled control consistently |
| Ship `:focus-visible` with `--san-halo` and honour `prefers-reduced-motion` | Accessibility is part of the contract |

Suggested first components, in dependency order: button, icon button, chip, text field, checkbox, radio, switch, tabs, menu, dialog, tooltip, card.

## Ports for Linux ricing

Generated today, one file per flavor:

| App | Path | How to use |
|-----|------|-----------|
| kitty | `ports/kitty/sanctuary-<flavor>.conf` | `include` it from `kitty.conf` |
| Ghostty | `ports/ghostty/sanctuary-<flavor>` | Copy to the themes directory and set `theme` |
| Alacritty | `ports/alacritty/sanctuary-<flavor>.toml` | Add to `import` in `alacritty.toml` |
| base16 | `ports/base16/sanctuary-<flavor>.yaml` | Feed to any base16 builder |
| GTK CSS | `ports/gtk/sanctuary-<flavor>.css` | `@import` in a Waybar or GTK stylesheet, then use `@san-accent` |
| Hyprland | `ports/hyprland/sanctuary-<flavor>.conf` | `source` it, then use `$san-accent` in borders |

Each port uses the flavor's default accent. The GTK and Hyprland files also expose all twelve pigments, so an accent can be chosen in the user's own config.

These files are generated from templates and have not been loaded in each application; treat them as a first draft to validate on a real desktop.

### Adding a port

1. Add a template function to `src/emit/ports.js` that takes a flavor and a `hex(path)` resolver.
2. Register it in `PORTS` with its file extension.
3. Run `pnpm run build` and `pnpm test`.

Candidates: foot, WezTerm, tmux, Zellij, Neovim, Rofi, Dunst, Starship, btop, Firefox, VS Code.

### Rendering the idea outside the browser

| Concept | On the desktop |
|---------|----------------|
| Stone | Terminal and bar backgrounds |
| Lead | Inactive window borders, gaps |
| Accent | Active window border, cursor, focused workspace |
| Flashed glazing | Blur and transparency of the compositor, tinted by the accent |
| Cast | Coloured window shadow or glow on the active window |
| Window | Wallpaper and lock-screen gradients |

## Versioning

- Token names are the public API. Renaming or removing one is a breaking change; adding one is not.
- Changing a colour value is a minor change if contrast guarantees still hold.
- Publish from one version number across tokens, stylesheet and ports, so a port can state which palette it matches.

## Open decisions

| Decision | Options | Note |
|----------|---------|------|
| Licence | MIT, Apache-2.0, or a split (code and palette) | Needed before the organisation goes public |
| Fonts | Keep the Google Fonts set or self-host | The showcase loads them from Google Fonts and falls back to system fonts offline |
| Wide gamut | Add Display P3 pigments | The engine clamps to sRGB today |
