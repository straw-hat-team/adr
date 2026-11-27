---
id: '1121224116'
title: Adopt Preview and General Availability for product launches
state: Draft
created: 2026-11-27
tags: [release, product]
category: General
---

# Adopt Preview and General Availability for product launches

## Context

Customers deciding whether to try a feature or depend on it in production need
to know what the team supports today. A roadmap describes work underway. A
release channel determines when customers receive updates. Neither answers
whether a particular feature is ready for production use.

In October 2020, Google Cloud replaced Early Access, Alpha, Beta, and General
Availability with Preview and General Availability as its standard launch
stages. We adopt this distinction so customers can make the same decision
across our products.

## Resolution

Use **Preview** and **General Availability (GA)** as our customer-facing launch
stages. Apply the stage to the product or feature being described in product
documentation and release notes. A GA product can contain Preview features.

### Preview

A feature qualifies for Preview when a customer can complete its documented
workflow end to end in a test environment. Publish access instructions, known
limitations, and a way to give feedback. The feature may change or be
withdrawn. Preview carries no default service-level agreement (SLA) or
technical support commitment. Document any exceptions alongside the feature.

Use **Private Preview** when participation requires an invitation or approval.
Use **Public Preview** when any eligible customer can try the feature directly.
Opening access to more customers changes who can participate. The production
commitment stays the same.

### General Availability

A feature qualifies for GA when all eligible customers can use it and the team
supports its documented behavior in production. Publish the applicable support
terms and any SLA. A feature can launch directly at GA. For a feature already
in Preview, announce GA when the team takes on that production commitment.

### Deprecation

Mark a feature **Deprecated** when the team has decided to remove it and
customers can still use it. The notice identifies what is affected, the
shutdown date if known, and the migration path if one exists.

## Applying the decision

Keep **Planned** and **In progress** for roadmap work. For example, a storage
service can be GA while its new export API is In progress. The API qualifies
for Private Preview once an invited customer can export data end to end. It
qualifies for GA when all eligible customers can run exports with production
support.

For an existing Alpha, Beta, or Available label, check who can use the feature
and which commitments already apply. A public beta offered for evaluation
maps to Public Preview. A feature labeled Available maps to GA only if the
team already supports its documented use in production. Preserve any existing
customer commitments when changing the label.

## Links

- [Google Cloud product launch stages](https://cloud.google.com/products#product-launch-stages)
- [Google Cloud's October 2020 announcement][announcement]

[announcement]: https://cloud.google.com/blog/products/gcp/google-cloud-gets-simplified-product-launch-stages
