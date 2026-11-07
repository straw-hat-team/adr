---
id: '3522444690'
title: Rust package names match package directories
state: Draft
created: 2026-11-07
tags: [rust, cargo, naming, directory, packages]
category: Platform
---

# Rust package names match package directories

## Context

Package lookup may start with a Cargo name, Rust library name or directory.
Cargo allows hyphenated names and can put such a package in an identically named
directory, but its default Rust library name replaces hyphens with underscores.
Copying an import name into a directory lookup can therefore find a different
spelling from the manifest's package identity.

We choose one literal spelling for owned Cargo packages, package directories and
library targets. Within a known workspace, a reader or tool can use that spelling
without deciding which name was normalized first.

## Resolution

### Canonical package identity

- Owned first-party Cargo `[package].name` values **MUST** be ASCII
  `lower_snake_case`, valid non-keyword Rust identifiers in the editions we
  support. Hyphens (`-`) **MUST NOT** appear. For example, use
  `acme_order_book`, not `acme-order-book`.
- Product and role word parts remain those defined in
  [ADR#3545947886](../3545947886/README.md), represented with underscores for
  Rust packages. Companion roles follow
  [ADR#2228057065](../2228057065/README.md), such as `acme_order_book_derive`.
- When a package has a library target, its default or explicit `[lib].name`
  **MUST** equal `[package].name`. Binary-only packages need no library target.

Cargo and Rust allow other spellings; the stronger identity rule is our team
policy. An explicit library target illustrates the invariant:

```toml
# crates/acme_order_book/Cargo.toml
[package]
name = "acme_order_book"
version = "0.1.0"

[lib]
name = "acme_order_book"
```

### Exact directory lookup

- Owned Cargo workspace members **MUST** live at
  `crates/<exact_package_name>/Cargo.toml`, relative to their Cargo workspace.
  The package directory basename **MUST** equal `[package].name` literally,
  as required by [ADR#5842232571](../5842232571/README.md).
- Tooling **MUST NOT** use `replace('-', '_')` or its inverse to guess an owned
  package's directory. The canonical manifest name is already the directory
  name. Use the known workspace root or `cargo metadata`'s `manifest_path`.
- A single-package repository **MAY** keep `Cargo.toml` at its root. Tools
  **MUST** use that root manifest or its metadata path, without inventing a
  `crates/` layer. A package name alone does not identify a repository or
  workspace root, nor locate an external registry dependency.

A consumer dependency alias **MAY** change its local import name. It does not
rename the package, library target or source directory. Generated macro paths
**MUST** still honor the consumer's alias; tools resolving physical packages
**MUST** use canonical Cargo identity and metadata instead of an alias.

### Scope of the spelling rule

Repository names, product names, project-container directories, images and
executables keep their own naming policies. Third-party package names **MUST**
remain those provided upstream. Cargo features are also separate:
[ADR#7592933658](../7592933658/README.md) keeps `macros` and `test-support`.

A binary name **MAY** remain kebab-case even when its containing Cargo package
uses underscores. `cargo install` selects the package; the executable's name is
configured independently:

```toml
# crates/acme_order_book_server/Cargo.toml
[package]
name = "acme_order_book_server"
version = "0.1.0"

[[bin]]
name = "acme-order-book-server"
path = "src/main.rs"
```

For a named project such as `projects/order-book/`, the Cargo package prefix uses
`order_book` while preserving its words. Package prefix ownership and collision
checks use that canonical representation, as specified in
[ADR#0752163629](../0752163629/README.md).

### Migration

Existing owned names that do not conform are migration work, not permanent
exceptions. A migration **MUST** account for registry naming constraints,
published package identities, dependency declarations, library paths, workspace
directories, CI and consumers. Verify registry support and ownership before
choosing a publication path; punctuation changes are not automatically safe
renames. This proposal does not itself rename packages or source directories.

## Links

- [Cargo package naming constraints](https://doc.rust-lang.org/cargo/reference/manifest.html#the-name-field)
- [Cargo target names and default library normalization](https://doc.rust-lang.org/cargo/reference/cargo-targets.html)
- [Cargo metadata and manifest paths](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html)
- [Cargo dependency aliases](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#renaming-dependencies-in-cargotoml)
- [Rust keywords](https://doc.rust-lang.org/reference/keywords.html)
