---
id: '1631648331'
title: Rust is the language for new services and programs
state: Approved
created: 2026-10-08
tags: [rust, go, elixir, language, backend, cli, embedded, gui, wasm, wasmtime, sandbox]
category: General
---

# Rust is the language for new services and programs

## Context

We write services and programs in Go, Elixir, and Rust today. Go and Elixir
have served us well: Go for its simplicity and fast builds, Elixir for the
BEAM's concurrency and fault tolerance, and the systems built with them keep
running.

Writing the software is the smaller part of its cost. Every language we run
brings its own lifecycle, and each one has to be kept healthy separately:

- **Building:** a compiler and toolchain to pin, a build and release pipeline,
  CI caching, container images, and cross-compilation targets.
- **Maintaining:** dependency upgrades, security advisories and audits,
  linters and formatters, and the shared libraries and conventions that keep
  codebases consistent.
- **Observing:** OpenTelemetry instrumentation and its semantic conventions,
  logging, metrics, profiling, and the knowledge needed to debug the runtime
  in production.

Settling on one language for new work means that investment is made once and
compounds, instead of being split across ecosystems. This decision is about
that consolidation, not about any shortcoming of Go or Elixir.

The primary reason for choosing Rust is trust earned at the bottom of the
stack. Linus Torvalds accepted Rust into the Linux kernel, the first language
besides C and assembly admitted there, with support merged in Linux 6.1. The
kernel holds the most demanding bar in the industry for correctness,
performance, and long-term maintenance, and its maintainers are conservative
about what they let in. A language trusted to write kernel drivers is a
language we can trust for everything above it.

That trust makes one language viable across the whole range of software:
systems programming, embedded firmware, command line tools, web servers,
background jobs, and desktop GUIs, from the same toolchain and with no runtime
to ship alongside the program. Choosing Rust means one toolchain, one set of
conventions, and engineers who can move anywhere in the stack without
switching languages.

WebAssembly is the other reason, and it carries almost as much weight. It is
how one piece of Rust code reaches places a native binary cannot:

- **Server-side components:** the component model and WASI let a program run
  sandboxed, with capabilities granted explicitly, on any host that embeds a
  runtime. When a program's dependencies and the host capabilities it needs
  are available under WASI, Rust keeps it one build away from running as a
  component.
- **Browser rendering:** the same code compiles to WebAssembly for the
  browser, so rendering and compute-heavy logic can share an implementation
  with the server instead of being written twice.
- **Untrusted code:** customer-provided extensions, plugins, and user-defined
  logic can run inside our own services, isolated in a WebAssembly sandbox
  behind host interfaces we define, whether or not those interfaces are WASI.

Rust is where that ecosystem is built. Wasmtime, the Bytecode Alliance
reference runtime for components and WASI, is written in Rust, and Rust has
the most mature tooling for compiling to WebAssembly. Embedding or extending
the runtime, and defining the host side of a sandbox, happens in the same
language as everything else.

The language itself adds to the case:

- It compiles to a native binary with no language runtime to install, and
  with a static target such as musl and dependencies that allow it, to a
  fully static one, so a CLI ships as one file and a service image carries
  little beyond the program.
- Its type system and ownership model move whole classes of defects (data
  races, null handling, unhandled error paths) from production to the
  compiler, which also gives fast, precise feedback to anyone or anything
  generating code.
- It has no garbage collector and a predictable memory profile, which keeps
  latency and resource usage boring under load.

## Resolution

- You **MUST** write new services and programs in Rust. That includes systems
  and embedded software, command line tools, web servers and APIs, background
  jobs, workers, and message consumers, desktop GUIs, and WebAssembly
  modules and components, whether they run on a server-side runtime, in the
  browser, or as hosts that sandbox untrusted code.
- You **MUST NOT** start a new service or program in Go or Elixir.
- You **MAY** keep maintaining and extending existing Go and Elixir codebases.
  This ADR is not a migration order, and rewriting working software to satisfy
  it is not expected.
- You **MUST** keep following the Elixir ADRs while working in an existing
  Elixir codebase; they still describe how that code is written.
- You **SHOULD** treat a significant rewrite of an existing Go or Elixir
  component as new work, and write the replacement in Rust.
- You **MUST** record any exception to this ADR in its own ADR that links back
  here, approved before the work starts.
- The exception ADR **MUST** carry a precise technical write-up of the decision,
  covering:
  - the concrete requirement Rust fails to meet, stated in measurable terms
    such as a latency budget, a missing protocol or driver, a target platform,
    or a runtime capability;
  - the evidence behind it: benchmarks, prototypes, crate evaluations, or
    upstream issues, with links or reproducible steps;
  - the Rust options considered, including crates, FFI, and WebAssembly
    components, and why each was ruled out;
  - the ongoing cost of the alternative language: toolchain, CI, release,
    observability, and who owns it;
  - the conditions under which the exception ends and the work moves to Rust.
- You **MUST NOT** use familiarity, preference, or delivery speed alone as the
  justification for an exception.

This ADR covers code that runs as a process, a binary, or WebAssembly. Browser
code written in JavaScript or TypeScript, and the tooling around it, is out of
scope.

## Links

- [Tech Radar: Rust](../../radar/items/rust.md)
- [Tech Radar: Go](../../radar/items/go.md)
- [Tech Radar: Elixir](../../radar/items/elixir.md)
