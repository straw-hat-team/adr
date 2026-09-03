---
name: direnv
quadrant: tools
history:
  - edition: '2026.2'
    ring: hold
tags: [developer-experience, environment, toolchain]
---

# direnv

direnv loads and unloads environment variables as you move in and out of a directory, driven by a `.envrc` that
lives next to the code. It carried our repositories for years, and the instinct behind it was the right one:
entering a project should be a `cd`, not a checklist. [mise](./mise.md) kept that instinct.

It is on Hold because in direnv the shell script is the interface. Everything is a program, so what began as a
few exports grows toolchain activation, a PATH prepend, a decryption call, and a branch for the one machine where
something is installed elsewhere. Reviewing that file means reading a program, and the version drift it hides is
exactly what the file was supposed to prevent.

mise is not more restrictive here, and the case for it is not that it forbids shell. It sources shell too:
`_.source` in `[env]` runs a bash script and takes what it exports, and `[hooks.enter]` runs shell in the current
shell on entering a project. The difference is which one is the default. Environment, toolchain versions, tasks,
and [SOPS](./sops.md)-decrypted secrets are declarations first, read the same way by `mise run` and by CI, with
shell reserved for the cases that genuinely need it. The declared `[env]` also unwinds on the way out, which hook
shell does not, so the escape hatch stays the narrower tool rather than the usual one.

Hold is not a removal order, but it is not a gradual migration either. mise's own guidance is to not run the two
together, since both bind environment to a directory and collide over `PATH`; there is no import of an existing
`.envrc`, and the `mise direnv activate` bridge that once allowed coexistence is deprecated. A repository with a
working `.envrc` is not an emergency and can keep it until someone converts it in one move. New repositories
should declare the environment in mise and skip the `.envrc`.
