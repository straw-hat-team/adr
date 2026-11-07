---
id: '2228057065'
title: Rust package and companion crate naming
state: Draft
created: 2026-11-07
tags: [rust, cargo, naming, macros, packages]
category: Platform
---

# Rust package and companion crate naming

## Context

A Cargo package name, a Rust library name, a companion suffix and a feature
flag identify different things. Confusing them makes `derive`, `macros` and import paths look
interchangeable and turns an implementation split into an application-facing
naming decision.

Established projects use descriptive companions such as `serde_derive`,
`tokio-macros` and `prost-build`. Their spellings demonstrate conventions, not a
compiler-enforced suffix. We need a consistent choice for our packages while
preserving the names and compatibility contracts consumers already use.

## Resolution

### Package, library and feature identities

Our owned Cargo packages **MUST** use product-first `lower_snake_case`, with no
hyphens. Keep the product word parts from
[ADR#3545947886](../3545947886/README.md), using this Rust-specific representation
where that proposal uses kebab-case. Cargo permits both hyphens and underscores;
this stricter spelling is our policy, not a Rust restriction.

A hyphenated package can have an exactly matching hyphenated directory, but its
default Rust library name replaces those hyphens with underscores. Using one
literal spelling for package, directory and library avoids that normalization
when a tool or reader moves between them.

| Identity               | Example                 | Meaning                                          |
| ---------------------- | ----------------------- | ------------------------------------------------ |
| Cargo package          | `acme_identity`         | `[package].name` and dependency package identity |
| Rust library           | `acme_identity`         | Default library target and import path           |
| Workspace directory    | `crates/acme_identity/` | Package directory within its workspace           |
| Optional macro feature | `macros`                | Capability selected by the consumer              |

Workspace placement follows the proposal in
[ADR#5842232571](../5842232571/README.md); a workspace package directory **MUST**
match its Cargo package name exactly. This does not require a `crates/` directory
in a repository that contains only one package.

Rust permits an explicit `[lib].name`, but an owned package with a library target
**MUST** keep that name equal to its package name. A dependency alias can still
change the consumer's import path without renaming the package or directory.
Documentation and generated paths **MUST** respect that consumer alias.

### Choose companions by their purpose

The normal library or facade **SHOULD** keep the base product package name.
Create a companion only when there is an actual compilation, dependency or
reusability boundary. New companions **SHOULD** use these purpose-specific names:

| Purpose                                                | Package example        | Rust library name      |
| ------------------------------------------------------ | ---------------------- | ---------------------- |
| Derive-only procedural macros                          | `acme_identity_derive` | `acme_identity_derive` |
| Attribute, function-like or mixed procedural macros    | `acme_identity_macros` | `acme_identity_macros` |
| Library supporting generation or setup from `build.rs` | `acme_identity_build`  | `acme_identity_build`  |
| Raw bindings to a native library                       | `acme_identity_sys`    | `acme_identity_sys`    |

`serde_derive` provides derive macros; `tokio-macros` provides attribute and
function-like procedural macros. These support the role distinction while
showing why our spelling policy is a team choice. `prost-build` illustrates the
build-support role; our suffix is `_build`. Cargo documents the ecosystem
`-sys` convention for native-library linking and low-level bindings; our suffix
is `_sys`. It **MUST NOT** label an arbitrary low-level Rust library or a
remote-service client.

Names such as `_macro_derive` **SHOULD NOT** combine redundant role words.
Do not introduce empty companions to complete this table or split every library
into `_core`, `_impl`, `_lib` or `_runtime` by default. Other meaningful parts
follow the product naming proposal, such as `acme_identity_storage`. An exception
to a companion suffix **SHOULD** explain its concrete purpose.

### Procedural macros and the public facade

Custom derives and other procedural macros are implemented in a `proc-macro`
library and consumed from another crate. For a runtime facade with public types,
that requires a separate procedural-macro crate. Rust enforces the crate type
and consumption boundary, not the `_derive` or `_macros` spelling. Ordinary
`macro_rules!` macros and handwritten trait implementations may remain in the
normal library.

The optional public feature **MUST** be `macros` for either companion suffix,
following [ADR#7592933658](../7592933658/README.md). A derive-only implementation
does not require a public feature named `derive` or `macro_derive`. The feature
**MUST** gate the helper dependency and public macro re-exports, while core types
and runtime validation remain available without it. A package whose core API is
procedural macros does not need a redundant `macros` feature.

Illustrative facade `Cargo.toml`:

```toml
[package]
name = "acme_identity"
version = "0.1.0"

[features]
default = []
macros = ["dep:acme_identity_derive"]

[dependencies]
acme_identity_derive = { version = "0.1", path = "../acme_identity_derive", optional = true }
```

Its library re-exports the derive macro:

```rust
#[cfg(feature = "macros")]
pub use acme_identity_derive::Identity;
```

Consumers normally depend on the facade:

```toml
[dependencies]
acme_identity = { version = "0.1", default-features = false, features = ["macros"] }
```

They import through `acme_identity`. If the consumer names its dependency
`identity` and sets `package = "acme_identity"`, its import path becomes
`identity`. Macro expansion paths **MUST** support dependency renaming; the package
suffix does not determine the consumer's chosen path. Keep the Rust
`#[derive(...)]` syntax unchanged when selecting a Cargo feature name.

The companion runs during compilation; generated implementations can still
perform runtime work. A name or re-export alone establishes no allocation or
performance guarantee.

### Compatibility

Owned packages that do not meet this spelling rule require an explicit migration
plan; they are not permanently exempt. This documentation **MUST NOT** trigger
unplanned package or source renames. Third-party package names remain unchanged.
Adding attribute or function-like macros to an established `_derive` package
does not by itself require renaming that package. Package names, library names,
dependency aliases and feature names have distinct compatibility effects. Changes
**MUST** include a consumer and release migration appropriate to their SemVer and
registry contracts. Feature compatibility aliases
may be retained as described in [ADR#7592933658](../7592933658/README.md).

The related product, workspace and feature records are separate proposals; this
ADR does not change their states or authorize repository-wide renaming.

## Links

- [Cargo package names](https://doc.rust-lang.org/cargo/reference/manifest.html#the-name-field)
- [Cargo library targets and default names](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#library)
- [Cargo dependency renaming](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#renaming-dependencies-in-cargotoml)
- [Rust procedural macro crate and consumption rules](https://doc.rust-lang.org/reference/procedural-macros.html)
- [Cargo native-library `-sys` convention](https://doc.rust-lang.org/cargo/reference/build-scripts.html#-sys-packages)
- [`serde_derive` 1.0.228 manifest](https://github.com/serde-rs/serde/blob/v1.0.228/serde_derive/Cargo.toml) and [derive exports](https://github.com/serde-rs/serde/blob/v1.0.228/serde_derive/src/lib.rs)
- [`tokio-macros` at Tokio 1.48.0](https://github.com/tokio-rs/tokio/blob/tokio-1.48.0/tokio-macros/Cargo.toml) and [macro exports](https://github.com/tokio-rs/tokio/blob/tokio-1.48.0/tokio-macros/src/lib.rs)
- [`prost-build` 0.14.1 manifest](https://github.com/tokio-rs/prost/blob/v0.14.1/prost-build/Cargo.toml) and [build-script usage](https://github.com/tokio-rs/prost/blob/v0.14.1/prost-build/README.md)
