---
name: Chrono
quadrant: languages-and-frameworks
history:
  - edition: '2026.3'
    ring: hold
tags: [rust, datetime, time-zones]
---

# Chrono

Chrono has been the default date and time crate in Rust for most of the language's life, and it did that job: a
timezone-aware `DateTime`, `strftime` style formatting, and chrono-tz for the IANA database.

It is on Hold because its maintainer is winding it down. In
[chronotope/chrono#1768](https://github.com/chronotope/chrono/issues/1768) chrono and chrono-tz were declared
soft-deprecated and unlikely to merge further changes, with the API described as dated and too costly to revise.
chrono-tz will no longer follow time zone database releases, which means zoned results drift from reality the
next time a government moves a clock. A RustSec unmaintained advisory is planned once [Jiff](./jiff.md) reaches
1.0.

Hold is not a removal order. Code using Chrono keeps working, and a dependency pulling it in transitively is not a
reason to fork anything. New code should use Jiff, and code that depends on chrono-tz for correctness should move
first.
