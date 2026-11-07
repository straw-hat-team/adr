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

For new packages, use the product-first kebab-case naming proposed in
[ADR#3545947886](../3545947886/README.md). Cargo permits both hyphens and
underscores; choosing kebab-case is our convention. Rust's default library name
replaces package-name hyphens with underscores.

| Identity               | Example                 | Meaning                                          |
| ---------------------- | ----------------------- | ------------------------------------------------ |
| Cargo package          | `acme-identity`         | `[package].name` and dependency package identity |
| Rust library           | `acme_identity`         | Default library target and import path           |
| Workspace directory    | `crates/acme-identity/` | Package directory within its workspace           |
| Optional macro feature | `macros`                | Capability selected by the consumer              |

Workspace placement follows the proposal in
[ADR#5842232571](../5842232571/README.md); a package directory **SHOULD** match its
Cargo package name. This does not require a `crates/` directory in a repository
that contains only one package.

The default import mapping is not universal: `[lib].name` can change the library
target name, and a dependency alias can change the consumer's import path.
Documentation and generated paths **MUST** respect the names actually configured.

### Choose companions by their purpose

The normal library or facade **SHOULD** keep the base product package name.
Create a companion only when there is an actual compilation, dependency or
reusability boundary. New companions **SHOULD** use these purpose-specific names:

| Purpose                                                | Package example        | Rust library name      |
| ------------------------------------------------------ | ---------------------- | ---------------------- |
| Derive-only procedural macros                          | `acme-identity-derive` | `acme_identity_derive` |
| Attribute, function-like or mixed procedural macros    | `acme-identity-macros` | `acme_identity_macros` |
| Library supporting generation or setup from `build.rs` | `acme-identity-build`  | `acme_identity_build`  |
| Raw bindings to a native library                       | `acme-identity-sys`    | `acme_identity_sys`    |

`serde_derive` provides derive macros; `tokio-macros` provides attribute and
function-like procedural macros. These support the role distinction while
showing why our spelling policy is a team choice. The `-build` pattern is used
by `prost-build`. Cargo documents `-sys` for packages that link native libraries
and provide their low-level bindings; it **MUST NOT** label an arbitrary
low-level Rust library or a remote-service client.

Names such as `-macro-derive` **SHOULD NOT** combine redundant role words.
Do not introduce empty companions to complete this table or split every library
into `-core`, `-impl`, `-lib` or `-runtime` by default. Other meaningful parts
follow the product naming proposal, such as `acme-identity-storage`. An exception
to a companion suffix **SHOULD** explain its concrete purpose.

### Procedural macros and the public facade

Custom derives and other procedural macros are implemented in a `proc-macro`
library and consumed from another crate. For a runtime facade with public types,
that requires a separate procedural-macro crate. Rust enforces the crate type
and consumption boundary, not the `-derive` or `-macros` spelling. Ordinary
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
name = "acme-identity"
version = "0.1.0"

[features]
default = []
macros = ["dep:acme-identity-derive"]

[dependencies]
acme-identity-derive = { version = "0.1", path = "../acme-identity-derive", optional = true }
```

Its library re-exports the derive macro:

```rust
#[cfg(feature = "macros")]
pub use acme_identity_derive::Identity;
```

Consumers normally depend on the facade:

```toml
[dependencies]
acme-identity = { version = "0.1", default-features = false, features = ["macros"] }
```

They import through `acme_identity`. If the consumer names its dependency
`identity` and sets `package = "acme-identity"`, its import path becomes
`identity`. Macro expansion paths **MUST** support dependency renaming; the package
suffix does not determine the consumer's chosen path. Keep the Rust
`#[derive(...)]` syntax unchanged when selecting a Cargo feature name.

The companion runs during compilation; generated implementations can still
perform runtime work. A name or re-export alone establishes no allocation or
performance guarantee.

### Compatibility

These rules guide new package decisions. They **MUST NOT** automatically rename
existing or third-party packages, including established underscore names.
Adding attribute or function-like macros to an established `-derive` package
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
