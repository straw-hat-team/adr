---
id: '7565730517'
title: Logging Level and Error Reporting Usage
state: Draft
created: 2025-03-31
tags: [error-reporting, logging, sentry, observability]
category: Platform
---

# Logging Level and Error Reporting Usage

## Context

Currently, the volume and quality of logs—particularly Sentry errors—are
reducing the effectiveness of the tool for debugging and operations. Much of the
logging noise stems from messages that do not require action, creating false
alarms and distracting from actionable issues.

### Sentry

Sentry should be a high-signal tool. All logs sent to Sentry must be actionable.

- Do not log messages to Sentry unless they require immediate investigation or
  fixing. Use the regular logger module for informational or ignorable issues.
- If a Sentry issue is raised:
  - Immediately assign it to yourself.
  - Fix it promptly. If unsure how to proceed, ask for help immediately.
- The long-term goal is to have a silent Sentry.

### Logger

Use the logger module for all standard logging purposes.

- `error` logs are treated as `500` errors and must be addressed.
  - Prefer `error` over `critical`, `alert`, or `emergency` unless there is
    a strong justification, in which case document the reasoning clearly.
- `critical`, `alert`, and `emergency` should be reserved for extreme
  situations, such as data corruption or unrecoverable system failures.
- `warning` logs are treated like `400` errors.
  - They signal that attention might be needed, but action is not always
    required.
  - If a warning proves meaningless or too frequent, it should either be
    removed, lowered, or replaced with metrics.
- Info/debug logs are always acceptable for internal understanding and
  observability.

Any log with the `error` `critical` `alert` or `emergency` must be acted
upon. Ideally, we should not have any of those logs. Treat them as an `500`
error. Being said, use `error` level instead of `critical` `alert` or
`emergency` unless there is a strong reason not to; please document it in that
case.

Use `warning` to call the attention, but it may or may not require action.
Ideally, we move the warning to a lower or higher level or add metrics instead.
Treat `warning` the log level as an `400` error.

## Resolution

- You `MUST NOT` log to Sentry unless the issue is actionable and needs fixing.
- You `MUST` treat `error` logs as production issues to be fixed. You `SHOULD`
  validate log level usage as part of code reviews. PRs introducing `error` or
  higher logs must justify them.
- You `SHOULD` avoid using `critical`, `alert`, or `emergency` unless
  strictly necessary.
- You `SHOULD` avoid noise from `warning` logs; triage them regularly.
- You `MUST` ensure all log levels reflect the severity and actionability of the
  issue.
- You `SHOULD` consider replacing repetitive logs with metrics when appropriate.
  You `SHOULD` prefer metrics for tracking recurring behavior or performance
  patterns instead of relying on log statements.
- You `MUST` use `info` or `debug` levels for logs that are purely
  observational and don’t require intervention.

## Terminology

### Error Reporter

An Error Reporter would be a service like [Sentry](https://sentry.io/),
[Datadog Error Tracking](https://www.datadoghq.com/product/error-tracking/).
