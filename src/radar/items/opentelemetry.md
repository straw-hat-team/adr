---
name: OpenTelemetry
quadrant: platforms
history:
  - edition: '2026.2'
    ring: adopt
tags: [observability, tracing]
---

# OpenTelemetry

Instrumentation is written against the OpenTelemetry APIs and shipped through the collector, so the choice of
backend stays a deployment decision instead of a rewrite. Reaching for a vendor agent or a proprietary SDK
instead needs a justification.
