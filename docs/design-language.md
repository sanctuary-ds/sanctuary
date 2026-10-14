# Design language

Sanctuary treats an interface as a dark building lit through coloured glass. Surfaces are stone and stay quiet; colour is light and is spent sparingly, where it means something.

## The one idea

A cathedral is mostly darkness. The windows read as intense because the stone around them does not compete. Sanctuary applies that ratio to interfaces: about nine parts stone to one part glass.

| Principle | In practice |
|-----------|-------------|
| Stone is quiet | Surfaces are near-neutral with a faint tint. No decorative gradients on stone. |
| Colour is light | Saturated colour marks action, state and focus. It is never wallpaper. |
| Light is cast | Glass colours its surroundings: glows, pooled colour, tinted focus. |
| Lead holds it together | Dark, definite lines separate panes. Borders are structure, not decoration. |
| Chiaroscuro | Contrast between surface levels is wide; mid-greys are avoided. |

## The four materials

| Material | Role | Tokens |
|----------|------|--------|
| **Stone** | Surfaces, from the sunken floor to the most raised panel | `surface`, `surface-sunken`, `surface-raised-1..4` |
| **Ink** | Text. Warm vellum on dark stone, cool ink on pale stone | `text`, `text-muted`, `text-subtle`, `text-disabled` |
| **Lead** | Borders and dividers; `came` is the near-black line between panes | `lead-soft`, `lead`, `lead-strong`, `lead-came` |
| **Glass** | Colour: twelve pigments, each with six roles per flavor | `glass-<pigment>`, `accent`, status and syntax aliases |

Ink is tinted against the stone on purpose: warm text on cool stone is what candlelight looks like, and it keeps long reading comfortable.

## Flavors: the canonical hours

A flavor is the hour at which you stand in the nave. The building is the same; the light is not.

| Flavor | Hour | Stone | Default accent | Use it for |
|--------|------|-------|----------------|-----------|
| Lauds | Dawn | Pale warm limestone, cool ink | cobalt | Bright rooms, documents, print-like reading |
| Vespers | Dusk | Plum-brown, warm text | amber | Evening work; the warmest dark flavor |
| Compline | Night | Blue slate, warm text | cobalt | The default: balanced and low-fatigue |
| Matins | Deep night | Near-black, faintly violet | ruby | OLED screens, terminals, maximum chiaroscuro |

Matins plays each glass one tone deeper than the other dark flavors, so colour stays jewel-like against black instead of pastel.

## Pigments

Twelve hues, named for the glazier's bench. The names that carry a chemical claim follow published analyses of medieval glass: blue from cobalt, red from copper, purple from manganese, yellow from silver stain applied to the surface. The rest are descriptive.

| Pigment | Hue | Note |
|---------|-----|------|
| ruby | 24° | Copper ruby, the red of the rose windows |
| ember | 47° | Red-orange |
| amber | 70° | Deep silver stain |
| gilt | 93° | Pale silver stain, the yellow of halos |
| verdure | 142° | Leaf green |
| viridian | 172° | Blue-green |
| azure | 228° | Sky blue |
| cobalt | 259° | The signature blue of Gothic glazing |
| indigo | 281° | Blue-violet |
| amethyst | 306° | Manganese purple |
| murrey | 342° | Mulberry red-purple |
| rose | 3° | Soft rose |

Each pigment is a ramp of eleven tones (`50` to `950`). Lightness is fixed per tone across all hues, so swapping the accent never changes contrast.

### Glass roles

A flavor chooses which tone of a pigment plays each role:

| Role | Purpose | Dark flavors | Matins | Lauds |
|------|---------|--------------|--------|-------|
| `glass-<p>` | The colour itself: fills, icons, accent text | 300 | 400 | 600 |
| `-lume` | Brighter emission: hover, glow, links | 200 | 300 | 400 |
| `-ink` | Text-safe on tinted backgrounds | 200 | 300 | 700 |
| `-pane` | A tinted container | 800 | 900 | 100 |
| `-on` | Content on the colour | 950 | 950 | 50 |
| `-on-pane` | Content on the pane | 100 | 200 | 800 |

Every pairing above is tested for WCAG AA (4.5:1) in every flavor.

## Glazing

Glazing is how an accent is held, independent of which accent it is.

| Glazing | Real technique | Rendering | Use when |
|---------|----------------|-----------|----------|
| Pot-metal | Glass coloured through its body | Solid fill, content in `-on` | Default; clearest hierarchy |
| Flashed | A thin coloured layer on clear glass | 20% tint, backdrop blur, coloured border, glow | Over imagery or wallpapers; desktop ricing |
| Grisaille | Monochrome painted glass with coloured borders | Stone fill, accent only as the border | Dense tools where colour must be rare |

## Windows

The window is the light that is *cast*: hero backgrounds, progress fills, glows, illustration. It never replaces the accent on a control, and it is a setting of the light, not a fourth axis: it always follows the accent, so cast light and controls tell one colour story.

| Setting | Light | Use when |
|---------|-------|----------|
| Mono (default) | The accent alone, from its pane to its lume | The quiet choice; most interfaces |
| Harmonic | The accent leaded with its two neighbours on the hue wheel (cobalt gives azure, cobalt, indigo) | Polychrome light that still agrees with the accent |

### Named windows

Five fixed gradients exist for a single place, such as a cover or an illustration (`background: var(--san-window-rosace)`). They do not follow the accent and are not a theme switch.

| Window | Pigments | Character |
|--------|----------|-----------|
| Rosace | ruby, murrey, cobalt | The classic red against blue |
| Jesse | verdure, gilt, ruby | Vine, gold and blood |
| Lancet | viridian, azure, indigo | Tall and cool |
| Aureole | gilt, amber, ember | Halo light |
| Vesperal | indigo, amethyst, rose | The west window at sunset |

## Light: Lumen and Cast

Material Design models elevation as distance from a light above. Sanctuary models it as *illumination*: in a dark room, what is closer to you is better lit.

- **Lumen** (`elevation-0..5` with `surface-raised-n`): each level is lighter stone plus a deeper umbra. In Lauds the stone tends to white and the shadow does the work.
- **Cast** (`cast-sm`, `cast-md`, `cast-lg`): the coloured glow glass throws on its surroundings. It signals energy: hover, selection, an active window.
- **Halo** (`halo`): the focus ring, a band of stone and then a band of light.

Use Lumen for hierarchy and Cast for state. A surface should rarely need both at full strength.

## Shape

Stone is cut, so radii are small (`xs` 2px to `xl` 20px). Roundness is spent on two signature shapes, both pointed arches generated as percentage polygons:

- `shape-lancet`: an arch on a rectangular body, for media, cards and window previews.
- `shape-ogive`: the arch alone, for avatars and badges.

The diamond (a square turned 45°) is the small-scale motif: bullets, status dots, the accent picker. It is the *quarry*, the plain diamond pane of ordinary glazing.

## Type

| Role | Family | Why |
|------|--------|-----|
| Display, headline | Cormorant Garamond | A high-contrast old-style serif: thin strokes read as light on dark stone |
| Title, body, label | Hanken Grotesk | A plain, legible sans so the serif stays special |
| Inscription | Cinzel | Roman capitals, wide-tracked, for overlines only |
| Code | JetBrains Mono | Shared with the terminal ports |

Blackletter is deliberately absent. The system is about the atmosphere of the building, not medieval costume.

## Motion

Two speeds. Controls respond fast (`fast` 140ms, `base` 220ms). Light moves slowly: changes of flavor, accent or glow use `procession` (900ms), like a cloud passing a window. Respect `prefers-reduced-motion` by removing both.

## What Sanctuary is not

| Compared with | Shared idea | Difference |
|---------------|-------------|------------|
| Catppuccin | Flavors and accents as modular axes; ports for everything | Tonal ramps instead of one colour per name; a third axis (glazing) and cast light that follows the accent; chiaroscuro instead of pastel |
| Material Design | Tiered tokens, tonal palettes, systemic type, shape, motion, state layers | Elevation as illumination with coloured cast light; arch shapes; stone, not paper |
