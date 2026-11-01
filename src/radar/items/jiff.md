---
name: Jiff
quadrant: languages-and-frameworks
history:
  - edition: '2026.3'
    ring: adopt
tags: [rust, datetime, time-zones]
---

# Jiff

Jiff is the date and time library for [Rust](./rust.md). It models instants, civil dates and times, and zoned
datetimes as distinct types, does time zone aware arithmetic and rounding, and reads the IANA time zone database
from the system or embeds it when the target has none, so daylight saving transitions are handled by the library
instead of by every caller.

It sits in Adopt because the alternative is going away. The maintainer of [Chrono](./chrono.md) soft-deprecated it
and chrono-tz in [chronotope/chrono#1768](https://github.com/chronotope/chrono/issues/1768), named Jiff as the
replacement they are comfortable recommending, and an unmaintained advisory is queued in RustSec for after Jiff
1.0. Picking Jiff now means one migration instead of two.

Jiff is still on 0.x, so a minor version can carry breaking changes. Pin it like any other pre-1.0 dependency and
expect one more API adjustment at 1.0; that is a smaller cost than starting on a library whose time zone data has
stopped being updated.
