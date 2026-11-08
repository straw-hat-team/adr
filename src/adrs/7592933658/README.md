---
id: '7592933658'
title: Reserved Cargo feature names
state: Draft
created: 2026-11-06
tags: [rust, cargo, features, testing]
category: Platform
---

# Reserved Cargo feature names

## Context

Consumers should recognize optional capabilities without learning a different
feature vocabulary for every library. Macro helpers and reusable testing helpers
are useful additions to a runtime API, but need not add dependencies or public
API to every consumer. Libraries supporting embedded or WebAssembly targets also
need to distinguish core functionality, owned storage and standard-library
integration.

Cargo features are additive and can be unified across dependency requests.
Defaults and convenience aggregates can therefore enable a capability that a
consumer did not name directly. A naming convention needs to define the capability,
its activation and the guarantees that remain when it is enabled.

## Resolution

Reserve feature names for shared capabilities in our Rust libraries. A library
only declares capabilities it offers as optional features. This policy does not
require every library to support `no_std` or environments without an allocator;
macro-only crates do not need a redundant feature to enable their core API.

### Reserved names

| Feature        | Meaning                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `macros`       | Optional public macro helpers, including procedural derives, attributes and literal constructors. |
| `test-support` | Reusable fixtures, fakes, builders or other helpers intended for tests in another crate.          |
| `alloc`        | APIs using Rust's allocation library, available without requiring the standard library.           |
| `std`          | APIs or dependency integrations requiring Rust's standard library.                                |

- A crate providing one of these optional capabilities **MUST** use its reserved
  name and **MUST NOT** reuse that name for another purpose. A crate without the
  capability **MUST NOT** declare an empty placeholder feature.
- `macros` and `test-support` **MUST** be opt-in. The `default` feature and its
  transitive feature closure **MUST NOT** enable them. This is our convention,
  not a Rust limitation or a universal ecosystem default.
- `std` and `alloc` **MAY** be enabled by default when appropriate for the
  library's usual callers. Their names describe capabilities, not default
  membership. Libraries **MUST** document their defaults and supported
  configurations.
- A production convenience aggregate such as `full` **MUST NOT** activate
  `test-support`, directly or transitively. It **MAY** include `macros` if that
  does not make `macros` part of the default feature closure.
- Dependencies used only by an optional capability **MUST** be optional and
  activated by that feature. Normal runtime dependencies remain available without
  these helpers.
- Third-party feature names **MUST** remain those defined by the dependency.
  Tokio's `test-util`, for example, is not renamed to `test-support`. Other
  capability names remain crate-specific; adding a reserved name requires an
  amendment to this ADR.

### Allocation and standard-library support

`alloc` **MUST** expose the library's allocation-dependent APIs without requiring
`std`. Examples include owned strings, collections and constructors consuming
those values. The final application or its runtime supplies the global allocator;
enabling this feature does not select an allocator, provide a per-operation
allocator parameter or guarantee that every operation allocates. An API accepting
an existing owned buffer may reuse it without another allocation.

`std` **MUST** enable actual standard-library support, such as I/O adapters or
standard-library integration in dependencies. When a library provides both
`std` and `alloc`, `std` **MUST** enable `alloc`. Libraries **MUST NOT** declare
empty placeholder features solely to match this vocabulary.

Features **MUST** add capabilities rather than disable them. A portable library
**MUST NOT** use a `no_std` feature to turn off standard-library support; it uses
the absence of `std` instead. `alloc` **MUST NOT** silently enable randomness,
clocks or platform bindings unrelated to owned storage. A WebAssembly target
does not by itself imply either `no_std` or the absence of an allocator.

For a library offering owned values, standard I/O adapters and optional Serde
integration, defaulting to `std` is valid:

```toml
[features]
default = ["std"]
alloc = ["serde?/alloc"]
std = ["alloc", "serde?/std"]
serde = ["dep:serde"]

[dependencies]
serde = { version = "1", default-features = false, optional = true }
```

The `alloc` and `std` features also gate the library's corresponding APIs. The
weak dependency forwarding syntax `serde?/alloc` only configures Serde if
another feature enables that optional dependency. It does not activate Serde
merely because a caller wants owned storage.

Callers can request the supported portable configuration with
`default-features = false` and `features = ["alloc"]`, or omit `alloc` when the
library supports a core-only configuration. Library documentation **MUST**
distinguish operations that borrow input, copy into owned storage or write into
caller-provided buffers. A `Result` returning constructor **MUST NOT** be described
as reporting allocation failure unless its implementation actually does so.

These are shared feature-naming conventions, not special Cargo keywords.
Dependency defaults and features **MUST** be configured to preserve each
advertised capability boundary. Audit the resolved target dependency graph:
changing a library's imports does not remove a dependency's `std` requirement.
Host-side procedural macros and build tools may use `std` while producing code
that supports a core-only target.

### Macro support

`macros` **MUST** gate the optional public macros, their re-exports and their
procedural-macro dependency. It **MUST NOT** gate the core types or validation
rules that runtime constructors need. Internal implementation macros are not
part of this optional public API.

Procedural macros still belong in a separate `proc-macro` crate and are consumed
from another crate. A feature makes that dependency optional; it does not remove
Rust's crate-type restriction. Shared validation rules **SHOULD** be reused by
runtime constructors and literal macros so they cannot disagree about validity.

For an illustrative library with a sibling macro crate:

```toml
[features]
default = []
macros = ["dep:example-macros"]
test-support = []
full = ["macros"]

[dependencies]
example-macros = { path = "../example-macros", optional = true }
```

Here, `test-support` exposes helpers without an extra dependency; it is not a
placeholder for an absent capability. A consumer **MUST** explicitly enable the
helpers it needs. With workspace inheritance, keep dependency defaults disabled
at workspace level when explicit selection is intended:

```toml
# Workspace Cargo.toml
[workspace.dependencies]
tokio = { version = "1", default-features = false }

# Member Cargo.toml
[dependencies]
tokio = { workspace = true, features = ["rt-multi-thread", "macros", "signal", "time"] }
```

The member adds to features requested elsewhere; its list is not an exclusive
allowlist. Workspace default overrides also depend on edition and toolchain, so
the workspace-level declaration avoids relying on newer override behavior.

### Test support and feature composition

Private tests **SHOULD** use `#[cfg(test)]` and dev-dependencies. `test-support`
exists for helpers that another crate needs: dependencies are not compiled with
their own `cfg(test)` merely because the consumer is running tests. Enabling the
feature exposes support APIs; it does not itself run tests.

Features **MUST** be additive. Enabling `test-support` **MUST NOT** replace
production implementations, disable validation or authorization, weaken secret
redaction, or change production behavior merely by being enabled. Helpers that
construct validated domain values **MUST** preserve those values' invariants.

The feature is not a security boundary. `--all-features` or another dependency
request can activate it, and `--no-default-features` is not a global veto on
features requested elsewhere. Test helpers **MUST** remain safe to compile
alongside the production API, without mutually exclusive feature modes.

### Verification and compatibility

CI **MUST** check default and no-default configurations, each reserved feature
provided by the crate, supported combinations and the all-features suite.
Portable libraries **MUST** verify their advertised core-only, `alloc` without
`std`, and `std` configurations against appropriate targets. An advertised
core-only configuration **MUST** compile in a consumer that does not supply a
global allocator. If WebAssembly support is advertised, checks **MUST** cover the
supported target and any required platform backend explicitly.

Consumer compile tests **MUST** verify that optional APIs are available only when
their enabling feature closure is active. Include an isolated consumer
configuration: a workspace build can otherwise hide missing gates through feature
unification. Disabling defaults in one dependency declaration does not prevent
another dependency from enabling `std` or `alloc` for the same library.

For existing published crates, feature names and default membership are part of
the compatibility contract. Migration **MUST** follow the crate's SemVer policy;
renaming a feature or removing it from defaults **MUST NOT** silently break
consumers. A compatibility alias **MAY** remain during migration, with the
reserved name documented as canonical.

## Links

- [ADR#2228057065](../2228057065/README.md): Rust package and companion crate naming.
- [Cargo features: optional dependencies, defaults and unification](https://doc.rust-lang.org/cargo/reference/features.html)
- [Cargo features: additive features and optional standard-library support](https://doc.rust-lang.org/cargo/reference/features.html#feature-unification)
- [Cargo workspace dependencies](https://doc.rust-lang.org/cargo/reference/workspaces.html#the-dependencies-table)
- [Rust allocation library](https://doc.rust-lang.org/alloc/)
- [Serde feature flags](https://serde.rs/feature-flags.html)
- [Rust procedural macros](https://doc.rust-lang.org/reference/procedural-macros.html)
- [time 0.3.55 optional macro feature](https://docs.rs/crate/time/0.3.55/features)
- [Tokio 1.54.1 feature definitions](https://docs.rs/crate/tokio/1.54.1/source/Cargo.toml)
