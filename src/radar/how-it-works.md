---
title: How the Tech Radar works
---

# How the Tech Radar works

## Rings

A ring is a statement about commitment, not about quality.

| Ring   | Meaning                                                                |
| ------ | ---------------------------------------------------------------------- |
| Adopt  | The default choice. Picking something else needs a justification.      |
| Trial  | Worth pursuing on real work, with someone accountable for the outcome. |
| Assess | Worth understanding and prototyping, not yet worth committing to.      |
| Hold   | Do not start anything new with it. Existing usage is not an emergency. |

## Quadrants

| Quadrant               | Holds                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| Techniques             | Ways of working, practices, and design approaches.                            |
| Tools                  | Software we run to build, verify, or operate things.                          |
| Platforms              | Things we build on top of, such as runtimes, infrastructure, hosted services. |
| Languages & Frameworks | Programming languages and the libraries we write code against.                |

Rings, quadrants, and editions are data, not code. They live in `.vitepress/radar.ts`, and every blip is
validated against them at build time.

## Editions

The radar is published as editions. A blip does not carry a current ring; it carries the ring it held in each
edition it appeared in:

```yaml
history:
  - edition: '2026.1'
    ring: assess
  - edition: '2026.2'
    ring: trial
```

The ring shown on the board is derived from the newest published edition, and the movement marker is derived
from the entry before it. This is why the board can show that something moved without anyone maintaining a
"moved" flag by hand:

- A circle means the ring did not change.
- A triangle pointing inward means it moved toward Adopt.
- A triangle pointing outward means it moved away from Adopt.
- A dashed halo means the blip is new in this edition.

A blip whose history starts in a future edition is not rendered, so the next edition can be prepared in the
open without publishing it early.

## Adding or moving a blip

Create the file:

```shell
make start_radar_item name="Some Technology"
```

Then fill in the frontmatter and say why in the body. Rules the build enforces:

- `quadrant` and every `ring` must exist in the taxonomy.
- Every `edition` must exist in the edition list, and may appear at most once per blip.
- `adr`, when present, must point at a real ADR directory under `src/adrs`.

Moving a blip means appending a new entry to its history for the current edition. Never edit a past entry,
because that rewrites what the radar said at the time.

A blip that overlaps an existing decision should link to it with `adr`. If the ring you want contradicts an
approved ADR, the ADR is the thing to change first.
