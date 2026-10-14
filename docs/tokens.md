# Token reference

Every token is a custom property prefixed `--san-`. The name is the DTCG token path joined with hyphens; a group's `$root` token takes the group's own name (`accent.$root` is `--san-accent`).

## Quick path

```css
@import "@sanctuary-ds/tokens/css"; /* resolved by a bundler; or link dist/css/sanctuary.css directly */

.button {
  background: var(--san-glaze-sheen), var(--san-glaze-bg);
  color: var(--san-glaze-fg);
  border: var(--san-border-width-hairline) solid var(--san-glaze-border);
  border-radius: var(--san-radius-sm);
  box-shadow: var(--san-glaze-glow), var(--san-elevation-1);
  backdrop-filter: var(--san-glaze-blur);
  font: var(--san-type-label-lg);
  letter-spacing: var(--san-type-label-lg-tracking);
}
.button:focus-visible { box-shadow: var(--san-halo); }
```

## Colour

### Stone, ink and lead (per flavor)

| Property | Use |
|----------|-----|
| `--san-surface-sunken` | Wells, inputs, the page behind panels |
| `--san-surface` | The base surface |
| `--san-surface-raised-1` … `-4` | Lumen levels 1 to 4; level 5 reuses `raised-4` |
| `--san-surface-inverse`, `--san-text-inverse` | Tooltips, toasts |
| `--san-text`, `-muted`, `-subtle`, `-disabled` | Text, in falling emphasis |
| `--san-lead-soft`, `--san-lead`, `--san-lead-strong` | Dividers, borders, emphasised borders |
| `--san-lead-came` | The near-black line between panes |
| `--san-umbra-key`, `--san-umbra-ambient` | Shadow colours used by `elevation-*` |
| `--san-scrim` | Overlay behind modals |

### Glass (per flavor, per pigment)

`<p>` is any pigment name.

| Property | Use |
|----------|-----|
| `--san-glass-<p>` | The pigment in this flavor |
| `--san-glass-<p>-lume` | Brighter light: glow, hover, gradients. Not for text |
| `--san-glass-<p>-ink` | Accent text: links, text on panes and on sunken stone |
| `--san-glass-<p>-pane` | Tinted container |
| `--san-glass-<p>-on` | Content on the pigment |
| `--san-glass-<p>-on-pane` | Content on the pane |
| `--san-pigment-<p>-50` … `-950` | Raw ramp. For illustration and data only |

### Accent, status, syntax, terminal

| Group | Properties |
|-------|-----------|
| Accent | `--san-accent`, `-lume`, `-ink`, `-pane`, `-on`, `-on-pane` |
| Status | `--san-danger` (ruby), `--san-warning` (amber), `--san-success` (verdure), `--san-info` (azure), each with the same six suffixes |
| Syntax | `--san-syntax-keyword`, `-string`, `-number`, `-constant`, `-function`, `-type`, `-property`, `-tag`, `-operator`, `-regex`, `-variable`, `-punctuation`, `-comment` |
| ANSI | `--san-ansi-black` … `-white` and `--san-ansi-bright-black` … `-bright-white` |

## Light (CSS only)

These are computed from the active flavor, accent, glazing and window setting.

| Property | Type | Use |
|----------|------|-----|
| `--san-glaze-bg`, `-bg-hover`, `-fg`, `-border` | colour | A glazed (accent-filled) element |
| `--san-glaze-sheen` | image | Highlight layered over `-bg` |
| `--san-glaze-glow` | shadow | Glow of the glazing |
| `--san-glaze-blur` | filter | `backdrop-filter` value |
| `--san-cast-sm`, `-md`, `-lg` | shadow | Coloured light around glass |
| `--san-halo` | shadow | Focus ring |
| `--san-state-hover`, `-focus`, `-pressed` | colour | State layer; uses `currentColor`, so it follows the content colour |
| `--san-window` | gradient | The cast-light gradient |
| `--san-window-a`, `-b`, `-c` | colour | Its three stops |
| `--san-harmony-a`, `-b`, `-c` | colour | The accent and its two hue-wheel neighbours; read by `data-san-window="harmonic"` |
| `--san-window-rosace`, `-jesse`, `-lancet`, `-aureole`, `-vesperal` | gradient | Named windows: fixed, independent of the accent, for one specific place |
| `--san-elevation-0` … `-5` | shadow | Lumen shadows (pair with `surface-raised-n`) |

## Foundations

| Group | Properties | Notes |
|-------|-----------|-------|
| Space | `--san-space-0`, `-px`, `-half`, `-1`, `-2`, `-3`, `-4`, `-5`, `-6`, `-8`, `-10`, `-12`, `-16`, `-20`, `-24`, `-32` | 4px grid: `space-4` is 16px |
| Size | `--san-size-control-sm/md/lg` (32/40/48px), `--san-size-icon-sm/md/lg`, `--san-size-measure` | |
| Breakpoint | `--san-breakpoint-sm/md/lg/xl/2xl` | Reference values; custom properties cannot be used in media queries |
| Radius | `--san-radius-none/xs/sm/md/lg/xl/full` | 0, 2, 4, 8, 12, 20px, pill |
| Border | `--san-border-width-hairline/came/heavy` | 1, 2, 3px |
| Shape | `--san-shape-lancet`, `--san-shape-ogive` | `clip-path` values, CSS only |
| Font | `--san-font-family-display/text/mono/inscription`, `--san-font-weight-regular/medium/semibold/bold` | |
| Type | `--san-type-<role>` and `--san-type-<role>-tracking` | `font` shorthand plus letter spacing |
| Duration | `--san-duration-instant/fast/base/slow/slower/procession` | 80 to 900ms |
| Easing | `--san-ease-standard/enter/exit/linear` | |
| Blur | `--san-blur-sm/md/lg` | For glass surfaces |
| State | `--san-state-disabled-content`, `-disabled-container` | Opacities |
| Layer | `--san-layer-base/raised/sticky/overlay/modal/toast/tooltip` | `z-index` |

Type roles: `display-lg/md/sm`, `headline-lg/md/sm`, `title-lg/md/sm`, `body-lg/md/sm`, `label-lg/md/sm`, `inscription`, `code-md/sm`.

## Using the DTCG files

`tokens/sanctuary.resolver.json` declares the sets and two modifiers a DTCG resolver needs:

| Modifier | Contexts | Default |
|----------|----------|---------|
| `flavor` | `lauds`, `vespers`, `compline`, `matins` | `compline` |
| `accent` | `flavor` (keep the flavor's default) or any pigment | `flavor` |

Glazing, cast, halo, state layers and the arch shapes are not in the token files: the format has no colour functions or string type. They are defined in `src/emit/css.js`.

## Using the plain palette

`dist/palette.json` holds resolved values for tools that do not want a token pipeline:

```json
{ "flavors": { "compline": { "scheme": "dark", "accent": "cobalt",
    "colors": { "surface": { "hex": "#0d111b", "oklch": [0.18, 0.022, 265] } } } },
  "pigments": { "cobalt": { "hue": 259, "tones": { "300": "#9bc1fb" } } } }
```
