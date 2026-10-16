---
id: '7616317836'
title: Config vs Options vs Settings for Component Wiring
state: Draft
created: 2026-07-29
tags: [naming, wiring, dependency-injection]
category: General
---

# Config vs Options vs Settings for Component Wiring

## Context

When constructing a long-lived component, you pass it the things it needs to
exist: its dependencies (clients, loggers, repositories) and its startup
values (URLs, timeouts, credentials). Across codebases, this input is
inconsistently named `Config`, `Options`, `Settings`, or `opts`, giving the
opportunity to bikeshedding and creating diverging codebases across the
organization.

### What counts as component wiring

The rule targets any component that is **wired once and used many times**,
regardless of what the component is called (service, client, repository,
store, publisher, worker, gateway, adapter):

1. It is constructed at application startup, in the composition root,
   dependency injection container, or supervision tree, not per operation.
2. It holds live collaborators and/or deployment-derived values.
3. Its lifetime spans many calls; the things it processes flow through it as
   arguments.

Concretely, per language: in Go, a struct with methods whose fields hold
things like `*sql.DB` or `*http.Client`, constructed from `main` or the
wiring layer. In Rust, a struct built in `main` and typically shared through
an `Arc`. In TypeScript, a class instantiated once at the entry point or by
the container. In Elixir, a supervised process or a client struct built once
and threaded through.

The litmus test: look at what is in the construction input. If it contains
anything alive (a connection, a client, a logger, another component) or
anything that came from the deployment environment (a URL, a secret, a
timeout), you are wiring, and this ADR applies. If it contains only domain
data, you are constructing a value, and this ADR does not apply.

Out of scope: domain objects (`User`, `Order`, `Money`), per-operation
inputs (commands, queries, requests), user-facing preferences, and the APIs
of third-party libraries we consume. This ADR governs the APIs we author.

### What each word promises

The three words are not synonyms; each one makes a different promise to the
reader:

- **Configuration** (from Latin _configurare_, "to shape by putting
  together") is the arrangement of parts into a whole. That is literally what
  wiring is: assembling a component from its constituent parts.
- **Option** (from Latin _optare_, "to choose") is a discretionary choice.
  Calling something an option tells the reader it may be omitted or that a
  default exists. A required database pool is not discretionary: you provide
  it or the component cannot exist.
- **Setting** (from "to set") is the position of a dial on something that
  already exists and runs. Every ecosystem reserves it for user-facing,
  runtime-mutable preferences.

### What the ecosystems say

- **Go** names the wiring struct `Config` in the standard library and major
  libraries (`tls.Config`, `ssh.ClientConfig`, `aws.Config`). The functional
  options pattern (`opts ...Option`) exists specifically for optional
  overrides on top of a working default. Passing required dependencies
  through options trades a visible missing struct field for a runtime
  "missing required option" failure.
- **Rust** wires through `Config` structs and builders
  (`rustls::ClientConfig`). The word "options" collides with `Option<T>`,
  the most-used type in the language, producing confusing code and
  documentation.
- **Elixir** distinguishes the two concepts in OTP itself:
  `GenServer.start_link(module, init_arg, opts)` places required wiring in
  `init_arg` and reserves `opts` for genuinely optional values with defaults
  (`:name`, `:timeout`). The habit of cramming required wiring into a single
  `opts` keyword list is a shortcut, not a design endorsement.
- **TypeScript** habitually uses `options` objects, but `config` is equally
  at home (`AxiosRequestConfig`, webpack and vite configs), so it tolerates
  either.

`Config` is the only word that is native or neutral in every ecosystem, and
the only one whose primary meaning describes the act of wiring itself.
Choosing `Options` would also consume the word that genuinely optional
inputs need, restarting the vocabulary drift this ADR exists to stop.

### The naming, per language

The type is named `Config`, scoped by the component's own namespace. The
parameter and variable are named `config` (one spelling, so search works).

The spelling is the clipped `Config`, not `Configuration`: every target
ecosystem has promoted the clipping to the canonical noun (`tls.Config`,
`rustls::ClientConfig`, `AxiosRequestConfig`, and Elixir's own stdlib
`Config` module). Documentation referring to the wiring input uses the same
spelling as the code, so there is exactly one name for the thing everywhere
it appears.

The variable is `config`, not `cfg` or `conf`: `cfg` is idiomatic only in
Go, collides with Rust's built-in `#[cfg(...)]` attribute and `cfg!` macro,
and vowel-stripped abbreviations tax non-native English speakers, the same
concern that motivated [ADR#6819030042](../6819030042/README.md). A single
spelling also keeps every wiring site findable with one search:

```go
// Go: the package provides the context, so the type is bare Config.
package accountservice

type Config struct{ /* ... */ }

func New(config Config) (*Service, error)
```

```rust
// Rust: the module provides the context.
pub struct Config { /* ... */ }

impl Service {
    pub fn new(config: Config) -> Result<Self, Error> { /* ... */ }
}
```

```typescript
// TypeScript: modules are flat at the import site, so the type carries
// the component name as a prefix.
export type AccountServiceConfig = {
  /* ... */
};

export class AccountService {
  constructor(config: AccountServiceConfig) {}
}
```

```elixir
# Elixir: the config lives under the component's module.
defmodule AccountService.Config do
  defstruct [...]
end

AccountService.start_link(config)
# supervision tree: {AccountService, config}
```

Optional wiring values do not justify a second parameter: they are optional
fields on `Config`, with defaults applied inside the component. This keeps
every constructor at exactly one wiring input and one vocabulary:

```go
type Config struct {
    HTTP    *http.Client  // required
    BaseURL string        // required
    Timeout time.Duration // optional: zero means default
}

func New(config Config) (*Service, error) {
    if config.Timeout == 0 {
        config.Timeout = 30 * time.Second
    }
    // ...
}
```

### The acknowledged trade-off

Config's cost shows up in Go: a struct field cannot distinguish "caller left
it empty" from "caller explicitly set zero", and required fields are not
enforced at compile time. The mitigations are standard: pointer fields or
explicit flags for meaningful zeros, and constructor validation that returns
an error for missing required fields. This is the one place options-style
APIs would have been mechanically nicer, and it does not outweigh the
reasons above.

## Resolution

- You **MUST** name the component wiring input `Config`, regardless of the
  programming language or ecosystem.
- You **MUST NOT** name the wiring input `Options`, `opts`, or `Settings`.
- You **MUST** name the wiring parameter and variable `config`; you
  **MUST NOT** abbreviate it to `cfg` or `conf`.
- You **MUST** use the clipped spelling `Config`, not `Configuration`. When
  documentation refers to the wiring input, it **MUST** use `Config` and
  `config` as well; the full word remains ordinary English only when
  discussing configuration as a general concept.
- You **MUST** scope the type by the component's namespace: bare `Config`
  inside a Go package or Rust module, `MyComponent.Config` in Elixir, and
  `MyComponentConfig` in TypeScript.
- Optional wiring values **MUST** be optional fields on `Config`, with
  defaults applied by the component; you **MUST NOT** add a separate
  `Options` parameter to component construction.
- You **MUST** reserve `Options` for genuinely optional inputs, where every
  value has a working default and the caller may omit it entirely.
- You **MUST** reserve `Settings` for user-facing, runtime-mutable
  preferences, never for component wiring.
- These rules apply to the APIs we author; call sites into third-party
  libraries keep whatever vocabulary those libraries chose.

## Links

- [ADR#1146361044](../1146361044/README.md), precedent for settling
  word-choice debates organization-wide.
- [ADR#6819030042](../6819030042/README.md), the readability concerns that
  also rule out abbreviated spellings.
