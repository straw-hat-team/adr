# Adapter protocol schemas

These are the fixed control/context and parameterized data contracts for proposed profile v0.2 in
[ADR#8612050910](../README.md). The [runtime rules](./runtime-semantics.md) define trust, method behavior, atomicity and
failure semantics. Application data slots are validated by their declared application schema; they do not permit
arbitrary control or trust fields. This source is the same artifact used by the example contracts and offline checker.

<<< ../assets/adapter-contracts.schema.json{json}
