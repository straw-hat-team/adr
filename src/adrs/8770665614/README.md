---
id: '8770665614'
title: License Files Follow Licensee Detection and the REUSE Layout
state: Approved
created: 2026-08-22
tags: [licensing, repository, open-source, spdx]
category: General
---

# License Files Follow Licensee Detection and the REUSE Layout

## Context

A repository states its license by putting the license text in a file, and
every consumer downstream reads that statement mechanically. GitHub's
license badge, the "License" line on a repository page, and the license
field of the GitHub API are produced by
[Licensee](https://github.com/licensee/licensee), which scores candidate
filenames and then compares the contents against the
[choosealicense.com](https://choosealicense.com) corpus at a default
confidence threshold of 98%. Compliance tooling in the wider ecosystem
reads the [REUSE](https://reuse.software/spec-3.3/) layout instead, which
is a different set of files in a different place.

The two are not variants of one convention, and each is unforgiving in a
way that is invisible from inside the repository. Licensee scores files in
the project root against a fixed table: `LICENSE` scores 1.00,
`LICENSE.md` 0.95, `COPYING` 0.90, `LICENSE-MIT` 0.70. It also scans the
top-level `LICENSES/` directory, where a filename in SPDX identifier
format with a `.txt`, `.md`, `.markdown`, or `.html` extension scores 1.00
and anything else scores 0.00. A file named `LICENSES/MIT` with no
extension is not seen at all.

The failure that matters is quieter than a missing file. Licensee resolves
the project license by collecting every matched file, mapping each to a
license, and taking the unique set. One license, and that license is
reported. More than one, and the answer becomes the pseudo-license
`other`, which is what a repository reading "View license" instead of
"MIT license" is telling you. A repository with `LICENSE-MIT` and
`LICENSE-APACHE` at its root has published two files and communicated
nothing machine-readable. Because the set is deduplicated by license
rather than by file, the same license in two places is not a conflict:
`LICENSE` and `LICENSES/MIT.txt` both matching MIT collapse to one entry
and report MIT.

REUSE governs the other half. Each license under which any covered file is
licensed **MUST** have a file at `LICENSES/<SPDX-License-Identifier>.<ext>`
in plain text, a license absent from the SPDX License List **MUST** use a
`LicenseRef-[idstring]` identifier, the directory **MUST NOT** contain
anything else, and it **MUST NOT** carry licenses nothing in the project
uses. REUSE also says, in as many words, that a project **MAY** keep
`COPYING` or `LICENSE` files "for compliance with other standards,
conventions, or tools", and that the REUSE tool ignores them.

That sentence is the whole design. The two conventions do not compete for
the same file; they ask for different files, and satisfying both costs one
duplicated license text.

Two naming hazards sit next to this decision, close enough in spelling to
be mistaken for each other:

- `Unlicense` is the SPDX identifier of
  [The Unlicense](https://spdx.org/licenses/Unlicense.html), a public
  domain dedication. It grants everything. It is the opposite of reserving
  rights, and the filename `UNLICENSE` scores 1.00 in Licensee's root
  table by the same regex that matches `LICENSE`, so the file is read, not
  skipped.
- `UNLICENSED` is npm's string for the `license` field of `package.json`,
  documented for the case where you "do not wish to grant others the right
  to use a private or unpublished package under any terms". It is not an
  SPDX identifier, it is not a license text, and it names the opposite
  condition from the identifier it nearly spells.

### Considered options

**Root file only.** Keep `LICENSE` and nothing else.

- Good, because it is what Licensee scores highest and what most
  repositories already have.
- Bad, because a repository under more than one license has no
  non-ambiguous way to say so. Every root-level scheme for expressing the
  second license (`LICENSE-MIT`, `COPYING.CC-BY`, `MIT-LICENSE`) is scored
  as a separate candidate, so the project license degrades to `other`.
- Bad, because REUSE tooling reports the project as non-compliant, and the
  root file is explicitly ignored by it.

**`LICENSES/` only.** Adopt REUSE and drop the root file.

- Good, because it is sufficient for REUSE compliance and expresses any
  number of licenses without ambiguity.
- Bad, because it discards the strongest convention there is. The root
  `LICENSE` file is what a human opens, what most licenses require be
  distributed with the software, and what tools older than REUSE look for.
- Bad, because the top-level answer then depends on the `LICENSES/` scan,
  which several consumers of license metadata do not implement.

**Root file, plus `LICENSES/` once a second license appears.**

- Good, because a single-licensed project keeps the one file every tool
  and reader already looks for, with no copy that can drift from it.
- Good, because Licensee deduplicates by license, so adding `LICENSES/`
  to a project changes nothing about how its primary license is reported.
- Good, because REUSE ignores the root file by specification, so the two
  layouts cannot invalidate each other.
- Good, because a multi-licensed project gets one place, `LICENSES/`, that
  lists every license in use in a form no tool has to guess at.
- Bad, because the primary license text exists twice in a multi-licensed
  project and the two copies can drift. Rule 7 below handles that.
- Bad, because a single-licensed project is not REUSE compliant until it
  adds `LICENSES/<SPDX-License-Identifier>.txt`.
- Bad, because a multi-licensed project still reports `other` as its
  top-line license. That is an accurate summary rather than a defect, and
  no layout avoids it.

## Resolution

Chosen option: root file, plus `LICENSES/` once a second license appears,
because a single license is fully stated by the root file, and the
duplicate only earns its maintenance cost when there is more than one
license to list.

1. Every repository **MUST** have a `LICENSE` file in its root, with no
   extension, containing the verbatim text of its primary license. The
   primary license is the one covering the source code; where a repository
   is mostly prose, it is the one covering the prose.
2. A repository distributed under more than one license **MUST** have a
   top-level `LICENSES/` directory containing one file per license under which any part of the repository
   is distributed, including the primary license. Filenames **MUST** be
   `<SPDX-License-Identifier>.txt`, spelled exactly as the
   [SPDX License List](https://spdx.org/licenses/) spells it, with
   verbatim text. Licensee validates the identifier's shape and not its
   existence, so `Apache2.0.txt` scores as high as `Apache-2.0.txt` and no
   tool reports the typo.
3. Within `LICENSES/`, terms not on the SPDX License List **MUST** use
   `LICENSES/LicenseRef-<idstring>.txt`. This is the only correct way to
   declare proprietary or all-rights-reserved terms, and the file holds
   the actual terms.
4. `Unlicense` **MUST NOT** be used to mean "not licensed" or
   "proprietary", and no file named `UNLICENSE` **MAY** be added for that
   purpose. It is a public domain dedication; adding it dedicates the work
   to the public domain, which is the reverse of the intent. A repository
   deliberately dedicating to the public domain uses it correctly, as
   `LICENSE`.
5. No other license-bearing filename **MAY** appear in the repository
   root: not `LICENSE.md`, `LICENCE`, `COPYING`, `LICENSE-MIT`,
   `MIT-LICENSE`, `OFL`, or `PATENTS`. Each is scored as an independent
   candidate, and a second distinct license among them turns the project
   license into `other`. A license whose own instructions mandate a
   filename is the exception: LGPL is distributed as `COPYING.lesser`
   beside `COPYING`, and Licensee has a dedicated rule for that pair.
   `COPYRIGHT` is permitted, because Licensee excludes it when deciding
   whether a project is multi-licensed.
6. `LICENSES/` **MUST NOT** contain anything but license files, and
   **MUST NOT** contain a license nothing in the repository uses. Removing
   a license from the repository removes its file.
7. Where `LICENSES/` exists, the root `LICENSE` and its counterpart in
   `LICENSES/` **MUST** hold the same text. Where the license carries placeholder fields, the year and
   holder are filled in identically in both. No other edit to license text
   is permitted: Licensee matches at 98% similarity, and an edited text
   falls to `other`.
8. Where a package manifest has a `license` field, it **MUST** carry an
   SPDX expression naming exactly the licenses the repository carries
   (`"MIT"`, `"MIT AND CC-BY-4.0"`, `"MIT OR Apache-2.0"`), and
   `SPDX-License-Identifier` headers **SHOULD** be used to attribute
   individual files where a repository is multi-licensed. npm's
   `"UNLICENSED"` is an npm-only string, not an SPDX identifier: it is
   correct in `package.json` for a package that grants no rights, and
   **MUST NOT** be written into a license file or a
   `SPDX-License-Identifier` header, where rule 3 applies instead.
9. A repository under exactly one license **MUST NOT** have a `LICENSES/`
   directory. The root `LICENSE` already states the license, and a second
   copy only adds a file that can drift from it. The directory appears
   with the second license, holding both.

## Consequences

- Single-licensed repositories need nothing beyond the root `LICENSE` and
  report the same license as before.
- Multi-licensed repositories report `other` as their top-line license and
  list every match in the licenses array. This is the honest answer, and
  the `LICENSES/` directory is where the detail lives.
- Repositories currently using `LICENSE.md` or `COPYING` rename to
  `LICENSE`. The rename is the whole migration for a single-licensed
  repository.
- Repositories with root-level `LICENSE-<ID>` files move each one to
  `LICENSES/<SPDX-ID>.txt` and put the primary license in `LICENSE`.
- REUSE tooling can be run against any multi-licensed repository following
  this rule without further layout work. A single-licensed repository
  does not pass REUSE, which is accepted: no tool this decision relies on
  needs more than the root `LICENSE` to report a single license. The remaining work for full REUSE
  compliance is per-file licensing information, which rule 8 asks for as
  a **SHOULD** rather than adopting REUSE wholesale.
- In a multi-licensed repository the duplicated primary license is a
  maintenance obligation. It is one file that changes only when the
  license changes, which is rare enough that rule 7 is cheaper than either
  convention's absence.
- This repository is itself affected: it distributes prose under
  CC-BY-4.0 and code samples under MIT, and currently declares that split
  only in prose in the README. Under this decision it carries
  `LICENSES/CC-BY-4.0.txt` and `LICENSES/MIT.txt` alongside the existing
  MIT `LICENSE`, and its detected license becomes `other`.

## Links

- [Licensee: What we look at](https://github.com/licensee/licensee/blob/main/docs/what-we-look-at.md)
- [Licensee: license file filename scoring](https://github.com/licensee/licensee/blob/main/lib/licensee/project_files/license_file.rb)
- [Licensee: project license resolution](https://github.com/licensee/licensee/blob/main/lib/licensee/projects/project.rb)
- [REUSE Specification v3.3](https://reuse.software/spec-3.3/)
- [SPDX License List](https://spdx.org/licenses/)
- [SPDX: Other licensing information detected (`LicenseRef-`)](https://spdx.github.io/spdx-spec/v2.3/other-licensing-information-detected/)
- [The Unlicense (SPDX `Unlicense`)](https://spdx.org/licenses/Unlicense.html)
- [npm `package.json` license field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#license)
- [GitHub: Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
