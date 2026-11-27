# Applying maintenance tiers to TrogonAI sandbox adapters

Suppose TrogonAI adds an operation to pause and resume a sandbox lease. In
this hypothetical release, Daytona is Tier 1 and E2B is Tier 2.

- **Daytona (Tier 1).** If pause and resume are in scope, the release waits
  until a conformance check pauses and resumes a Daytona sandbox.
- **E2B (Tier 2).** The release can ship once the listing documents the gap
  and checks pass for existing capabilities such as command execution.
- **A community adapter.** Its maintainer decides when to add the operation.
  Users consult that maintainer's compatibility documentation.

Now suppose the same change also breaks command execution on a supported E2B
version. That regression blocks the product release because users already rely
on command execution. The team can ship a compatibility fix while still
deferring pause and resume.

[ADR#7568965702](../README.md)
