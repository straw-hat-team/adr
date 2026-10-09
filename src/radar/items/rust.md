---
name: Rust
quadrant: languages-and-frameworks
history:
  - edition: '2026.3'
    ring: adopt
adr: '1631648331'
tags: [rust, backend, cli, embedded, gui, wasm, sandbox]
---

# Rust

Rust is the language for new services and programs, from systems and embedded software through command line tools,
web servers, and background jobs, up to desktop GUIs. One toolchain and one set of conventions replace the
per-language pipelines we used to keep in parallel.

It sits in Adopt because of where its trust comes from. Linus Torvalds accepted Rust into the Linux kernel, the
first language besides C and assembly admitted there. A language trusted to write kernel drivers is one we can
trust for everything above it, and that is what makes a single language across the whole stack viable.

WebAssembly carries almost as much weight, because it takes the same Rust code where a native binary cannot go.
It runs as a sandboxed component on a server-side runtime when its dependencies and the host capabilities it needs
are available under WASI, it renders in the browser alongside the server code it shares an implementation with, and
it isolates untrusted code such as customer-provided extensions and plugins inside our own services, behind host
interfaces we define. Wasmtime, the reference runtime for the component model and WASI, is written in Rust, so
embedding the runtime and defining the host side of a sandbox happen in the same language as everything else.
Browser code written in JavaScript or TypeScript is not part of this placement.

It also covers every shape of software we write without a language runtime to ship alongside it. Built for a static
target such as musl, a CLI is a single file and a service image carries little beyond the program, and the compiler
catches data races, missing null handling, and ignored errors before they reach production.

Starting new work in another language needs its own ADR with a precise technical write-up: the measurable
requirement Rust fails, the evidence for it, the Rust options ruled out, and when the exception ends.

See [ADR#1631648331](../../adrs/1631648331/README.md).
