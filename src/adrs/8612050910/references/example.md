# Complete example contract

This is the proposed application authoring file for Draft [ADR#8612050910](../README.md). Read the
[specification and worked trace](./specification.md) for its meaning and validation boundary.

The editable source is `assets/review-coordinator.asyncapi.yaml` beside the ADR. An application would author this
content as `asyncapi/asyncapi.yaml`. The source is included directly here so this page does not maintain another copy.

## Coordinator

<<< ../assets/review-coordinator.asyncapi.yaml{yaml}

## Worker counterpart

The worker describes its actual receive/send directions. The coordinator imports and links this contract explicitly.

<<< ../assets/review-worker.asyncapi.yaml{yaml}

## Shared external native configuration

This file is the authority for the referenced resource; neither application independently edits its configuration.

<<< ../assets/review-native.json{json}

## Offline bundle lock

Hashes cover exact artifact bytes. Normal checking rejects mismatch; explicit lock refresh records intentional changes.

<<< ../assets/bundle.lock.json{json}
