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

Teams **MUST** use **Preview** or **General Availability (GA)** to describe a
launch in product documentation and release notes. The label **MUST** identify
the product or feature it covers. A GA product can contain Preview features.

### Preview

Before labeling a feature Preview, the team **MUST** make its documented
workflow usable end to end by a customer in a test environment. The team
**MUST** publish access instructions and known limitations. It **SHOULD**
provide a way for customers to give feedback.

Teams **MUST** use **Private Preview** when participation requires an invitation
or approval and **Public Preview** when any eligible customer can try the
feature directly. Both labels carry the same commitment. The feature can
change or be withdrawn. Preview carries no default service-level agreement
(SLA) or technical support commitment. The team **MUST** document any
exceptions alongside the feature.

### General Availability

Before announcing GA, the team **MUST** make the feature available to all
eligible customers and support its documented behavior in production. The team
**MUST** publish the applicable support terms and any SLA. A team that meets
these requirements **MAY** launch directly at GA.

### Deprecation

When a team decides to remove a feature that customers can still use, it
**MUST** mark the feature **Deprecated**. The notice **MUST** identify what
is affected, give the shutdown date if known, and describe the migration path
if one exists.

## Applying the decision

Teams **MUST** reserve **Planned** and **In progress** for roadmap work. For
example, a storage service can be GA while its new export API is In progress.
The API qualifies for Private Preview once an invited customer can export
data end to end. It qualifies for GA when all eligible customers can run
exports with production support.

Before changing an existing Alpha, Beta, or Available label, the team **MUST**
verify who can use the feature and preserve existing customer commitments. A
public beta offered for evaluation maps to Public Preview. A feature labeled
Available qualifies for GA only when all eligible customers can use it with
production support.

## Links

- [Google Cloud product launch stages](https://cloud.google.com/products#product-launch-stages)
- [Google Cloud's October 2020 announcement][announcement]

[announcement]: https://cloud.google.com/blog/products/gcp/google-cloud-gets-simplified-product-launch-stages
