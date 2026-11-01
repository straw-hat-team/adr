---
name: Jiff
quadrant: languages-and-frameworks
history:
  - edition: '2026.3'
    ring: assess
tags: [rust, datetime, time-zones]
---

# Jiff

Jiff is the date and time library for [Rust](./rust.md). It models instants, civil dates and times, and zoned
datetimes as distinct types, does time zone aware arithmetic and rounding, and reads the IANA time zone database
from the system or embeds it when the target has none, so daylight saving transitions are handled by the library
instead of by every caller.

It sits in Assess because it is the likely successor rather than a settled one. The maintainer of
[Chrono](./chrono.md) soft-deprecated it and chrono-tz in
[chronotope/chrono#1768](https://github.com/chronotope/chrono/issues/1768) and named Jiff as the replacement they
are comfortable recommending, which makes it the first library to prototype against when Chrono comes up.

What keeps it out of Trial is that Jiff is still on 0.x, so a minor version can carry breaking changes, and the
RustSec unmaintained advisory for Chrono is deliberately waiting for Jiff 1.0. Learn the API, try it where a
datetime dependency is new, and revisit the placement at 1.0.
