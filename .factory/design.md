# Visual thesis: the key orchard at dusk

Worktree Secret Broker uses **surreal editorial scenery** to explain a narrow
security boundary. A single coral worktree grows beneath suspended keyholes.
Only three brass keys descend into its lit root chamber. Other keys remain
distant, dark, and unreachable. The image makes selection and isolation clear
without putting instructions inside the artwork.

## Palette

The site is intentionally single-mode: a nocturnal field makes the isolated
lease visible and keeps the terminal preview central.

| Token | Value | Use |
| --- | --- | --- |
| `--night` | `#101b26` | page background |
| `--deep` | `#172737` | raised surfaces |
| `--paper` | `#f6efd9` | primary text |
| `--mist` | `#c4c8bd` | secondary text |
| `--coral` | `#ff8066` | actions and lease path |
| `--ink` | `#16202a` | text on coral |
| `--brass` | `#e8bd67` | keys and active status |
| `--fern` | `#75c59c` | success |
| `--warning` | `#ffd18a` | caution |
| `--danger` | `#ff9a90` | errors |

Body text on night is 13.4:1. Coral on night is 7.0:1. Ink on coral is 7.2:1.

## Type and spacing

Display text uses the self-hosted Fraunces variable subset, whose soft,
editorial shapes fit the landscape. Interface and code use the self-hosted
Atkinson Hyperlegible subset for clear punctuation and terminal scanning.
The scale is 14, 16, 20, 28, 44, and 68 pixels. The spacing rhythm uses 4, 8,
16, 24, 40, 64, and 96 pixels. Reading measure stops at 68 characters.

## Shape and interaction grammar

Cards are rare. Content sits in wide editorial bands separated by thin brass
rules and topographic curves. Buttons have clipped lower-right corners, like a
temporary access ticket. Terminal controls use square status lamps and
tabular figures. Focus rings are double coral-and-night outlines.

## Motion

The hero has one physical idea: keys settle down toward the worktree once on
load. Interface changes use 180–240 ms opacity and transform transitions.
Nothing loops. With `prefers-reduced-motion`, keys appear in place and all
scroll and transition motion becomes instant.

## Asset plan and provenance

- `site/public/key-orchard.webp`: original AI-generated editorial illustration.
  Prompt: “Surreal editorial cut-paper landscape at blue-black dusk; one coral
  bonsai-like worktree grows from a precise circular cutaway in dark soil;
  exactly three small antique brass keys descend on thin threads into its
  illuminated root chamber while distant keyholes remain dim; tactile paper,
  subtle grain, screenprint shadows, generous negative space, wide composition,
  no people, no lettering, no logos, no gradients, no watermark.” Generated on
  2026-08-28 with the Param Factory `factory-image` deployment using
  `/opt/fleet/lib/gen-image.sh`, then converted locally to WebP.
- `site/public/og-image.webp`: 1200×630 crop composed from the same original.
- Wordmark, favicon, and interface symbols are hand-made SVG/CSS geometry.

All assets are original for this product. No stock art, icon library, CDN, or
third-party runtime asset is used.

The self-hosted Fraunces and Atkinson Hyperlegible font files come from their
upstream Google Fonts packages under the SIL Open Font License 1.1. Their
notice is recorded in `THIRD_PARTY_NOTICES.md`.
