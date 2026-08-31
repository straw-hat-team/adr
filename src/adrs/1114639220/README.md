---
id: '1114639220'
title: Automations Are Named as Agents, Not as the Commands They Send
state: Approved
created: 2026-08-31
tags: [naming, cqrs, messaging, elixir]
category: General
---

# Automations Are Named as Agents, Not as the Commands They Send

## Context

A message-driven codebase already names its messages by clause form. A
command is an imperative clause, `ChargeInvoice`, because a command is a
request to do something. An event is a past-tense clause,
`InvoiceCharged`, because an event is a thing that happened. Nobody
argues about those two, and the forms are consistent enough that a
reader infers the kind of message from the shape of the name alone.

Next to the messages lives a second population that the grammar above
says nothing about: the automations. Background jobs, stream pipelines,
event subscribers, scheduled tasks, projectors. They sit in their own
namespace (`Processor.*`, `Projector.*`, `Workers.*`, whatever the
codebase picked), so the reader already knows the kind of thing before
reading the last segment. The only open question is what the last
segment says.

Two styles show up, frequently in the same repository, split along
whichever team wrote the module first:

| Style      | Example                            |
| ---------- | ---------------------------------- |
| Imperative | `Billing.Processor.ChargeInvoice`  |
| Agent noun | `Billing.Processor.InvoiceCharger` |

Both are readable, which is why the choice looks like taste and gets
re-argued every few months, usually settled by whoever cares most that
week. It is not taste. The question is which word class names a thing
that runs, and the answer is already constrained by the fact that the
imperative form is spent on the messages.

### The imperative is the message's form, not the machinery's

Microsoft's CQRS reference makes the split visible in one example
without commenting on it: the message is `RateProduct`, an imperative
clause, and the code that receives it is `ProductsCommandHandler`, a
noun. The imperative names the thing that is asked for; the noun names
the thing that does it.

The general naming rule says the same thing from the other side.
Microsoft's Framework Design Guidelines: "DO name classes and structs
with nouns or noun phrases, using PascalCasing. This distinguishes type
names from methods, which are named with verb phrases."

There is a reason a command message is the exception that gets an
imperative. A command is a speech act, and an imperative clause is what
that speech act looks like written down. The module is not describing a
request; it is the request. An automation is not a speech act. It is a
participant: it starts, it is supervised, it is enqueued, its name is
written into a job row and queried later, it appears in a supervision
tree and in configuration. Things that participate are referred to with
noun phrases.

### English already separates the act from the actor

An agent noun is "a word that is derived from another word denoting an
action, and that identifies an entity that does that action". English
forms them productively with `-er`: "a person or thing that does an
action indicated by the root verb", with `toaster` and `computer`
sitting in the same sense as `runner` and `reader`.

Productivity is the useful part. For any domain verb the codebase
already uses in a command, the derived noun exists or is derivable, so
the naming rule has exactly one shape and no branch to choose. This is
the everyday mechanism by which a speaker distinguishes "charge the
invoice" from "the invoice charger", and it costs nothing to reuse.

It also answers the strongest objection to agent nouns, that `-er`
assigns the module the agent role of the verb while in CQRS the
authority for the change belongs to the aggregate and the automation
merely dispatches a command. The suffix does not carry that claim. A
`toaster` is not accountable for breakfast and a `printer` does not
author the document; the sense covers things, not only actors. An
automation is exactly such a thing: what the system uses to get the
action performed.

### The imperative form collides, and the collision is silent

Give the automation the imperative form and, inside one context, two
different modules end up with one name: the command
`Billing.Command.ChargeInvoice` and the automation
`Billing.Processor.ChargeInvoice`. Speech degrades first. "Who
dispatches `ChargeInvoice`? `ChargeInvoice`." A convention that makes
that sentence the correct one has failed at the only job a name has.

Elixir then charges for it a second time. `alias` binds the last
segment: "calling `alias` without the `:as` option automatically sets an
alias based on the last part of the module." Aliasing both modules in
one file rebinds the name to whichever came last, with no warning and no
error (verified on Elixir 1.20.1). The mitigation, aliasing the parent
and writing `Command.ChargeInvoice` and `Processor.ChargeInvoice` at
every call site, is a house rule that every file has to remember and no
compiler enforces. Other ecosystems pay in their own currency: a second
Python `from ... import ChargeInvoice` silently rebinds the first, and
Java refuses to import two classes of the same simple name at all, so
every use site spells the package out.

This repository has retired words for colliding before, `container`
against OCI and `object` against its program-construct sense
([ADR#1394819661](../1394819661/README.md)). The same test applies here,
and the imperative fails it against vocabulary this codebase defines
itself.

### Considered options

**Imperative verb phrase for automations** (`Processor.ChargeInvoice`).

- Good, because the leaf states the effect directly, and a reader does
  not have to de-nominalize anything to learn what the module does.
- Good, because the form cannot express vagueness: `Manage` is not a
  name, while `Manager` is, so the grammar itself resists the mechanism
  words.
- Good, because verb-object order keeps long names scannable.
- Bad, because it names a running thing with a clause, and the module is
  not a speech act.
- Bad, because it spends a form the vocabulary has already assigned, so
  one string names two kinds of thing in one context.
- Bad, because that collision is silent in Elixir rather than a compile
  error, and mitigated only by discipline at every use site.
- Bad, because automations that perform several actions have no single
  true verb, forcing extra branches (superordinate verbs, process nouns)
  precisely where naming is already hardest.

**Agent noun derived from the domain verb** (`Processor.InvoiceCharger`).

- Good, because a noun phrase is the word class a module identifier
  needs.
- Good, because `-er` derivation is productive, so one shape covers
  every automation with no judgment call.
- Good, because it cannot collide with the message vocabulary; the two
  populations are in different word classes by construction.
- Good, because it reads correctly at every use site: supervision trees,
  aliases, configuration, persisted job rows, and conversation.
- Good, because it matches what job and pipeline libraries name things
  in their own documentation, so the convention costs a new hire
  nothing.
- Bad, because the reader de-nominalizes it back to a verb on each read.
- Bad, because the spelling of the derived noun is occasionally
  unobvious (`Canceler`, `Redactor`).
- Bad, because the mechanism words wear the same suffix (`Worker`,
  `Handler`), so the suffix alone cannot tell an informative name from
  an empty one, and part of the check stays with review.

**Mechanism noun** (`InvoiceWorker`, `InvoiceHandler`,
`PaymentManager`).

- Bad, because it names the machinery rather than the work, so the
  `use`, `extends`, or decorator line already said it and the module
  itself is still unnamed.
- Bad, because the name churns whenever the mechanism changes, though
  nothing about the domain did.
- Bad, because these words stay true no matter what the module is
  rewritten to do, which is what makes them the attractor every naming
  convention drifts toward.
- Note that this rejects naming a module after the machinery it happens
  to run on. It does not reject a general word that happens to be true:
  a module whose job really is scheduling, routing, or proxying is
  covered by rule 2, not by this option.

**Process or gerund noun** (`InvoiceCharging`, `TrialExpiration`).

- Good, because it never asserts a verb that is false of some clause,
  which is a real problem for multi-step automations.
- Bad, because it names an activity rather than the thing performing it,
  and the activity noun is the natural name for the phase, the saga, or
  the context that contains the automation.
- Bad, because it is grammatically complete while carrying no
  commitment, so `Handling` and `Management` are well-formed under it.
  It does not resist the drift toward mechanism words; it is that drift
  with better manners.

## Resolution

Chosen option: an automation is named with the agent noun of the work it
does, because the imperative is already the message form, an automation
is a participant rather than a speech act, and only the noun form keeps
the two populations from sharing a name inside one context.

That commands are imperative and events are past tense is the premise
this decision reads off, not a rule it makes. The rules below govern the
automation module, and only its name.

1. An automation module, meaning anything that runs on its own
   (background job, stream pipeline, event subscriber, scheduled task,
   projector), **MUST** be named with a noun phrase and **MUST NOT**
   take a clause form, neither the imperative of a command nor the past
   tense of an event. Those shapes belong to the messages, and an
   automation that borrows one claims to be a message.
2. The head of that noun phrase **MUST** be the agent noun of the work
   the module does, with the object in front of it: `InvoiceCharger`,
   `TrialExpirer`, `CarrierRateFetcher`, `PaymentRefunder`. Where the
   work is general, the general role noun is that agent noun rather than
   an exception to it: a module that decides when other work runs is a
   `Scheduler`, one that decides where each message goes is a `Router`,
   one that forwards to another system is a `Relay`. The leaf carries the
   agent noun even where the namespace already says it:
   `Projector.OrderProjector`, not `Projector.Order`. The last segment
   is what an alias binds, what a stack trace prints, and what a person
   says out loud, and `Order` alone names the entity rather than the
   thing that projects it.
3. A module that consumes events and writes a read model **MUST** be
   named `*Projector`, with the projection it maintains in front:
   `OrderProjector`, `InvoiceBalanceProjector`. Projecting is the work,
   `Projector` is its agent noun, and no other word names that job, so
   the one place the vocabulary is fixed rather than chosen is here.

Use the established English word rather than coining one. That is
sometimes an `-er` derivation, sometimes `-or` (`Redactor`,
`Initiator`), and sometimes the bare noun, since English also forms
agent nouns by conversion: a `Relay` relays and a `Proxy` stands in, so
`Relayer` invents a word for a job that already has one. When no
idiomatic noun exists, or the obvious derivation reads as an unrelated
word (`Skipper`), the verb is usually the wrong one.

This settles the word class and stops there. Which agent noun is right,
how specific it should be, whether a noun is too empty to carry a
module, and how work is divided between modules all stay review
questions, and this ADR keeps no list of forbidden words for them. In
particular, a lint check **MUST NOT** be a denylist: one that rejects
`Scheduler` rejects the correct name for a module that schedules.

### Applying the rules

| Situation                                          | Name                                    |
| -------------------------------------------------- | --------------------------------------- |
| Job that charges an invoice                        | `Billing.Processor.InvoiceCharger`      |
| Scheduled task that expires trials                 | `Subscription.Processor.TrialExpirer`   |
| Pipeline that ingests carrier rates                | `Shipping.Processor.CarrierRateFetcher` |
| Subscriber whose job is deciding when dunning runs | `Billing.Processor.Scheduler`           |
| Subscriber that republishes every event to a bus   | `Processor.EventBusRelay`               |
| Projector for the order read model                 | `Repo.Projector.OrderProjector`         |
| The message any of the above dispatches            | `Billing.Command.ChargeInvoice`         |

## Consequences

- The imperative belongs to exactly one population. Reading
  `ChargeInvoice` anywhere in the codebase tells you it is a message,
  before you look at the namespace.
- Reviews stop arguing about form and argue about word choice, which is
  the part worth arguing about and the only part left to judgment.
- Every module named after the machinery that runs it fails rule 2,
  since `Worker` is not the agent noun of anything the module itself
  does. Renaming them is mechanical, so long as an automation's
  persisted identity (a queue row naming its worker, a subscription
  name, a projection version) is pinned to an explicit configured name
  rather than derived from the module name. Where it is not, this
  decision is also a data migration.
- A generic-sounding name is not automatically a violation. The question
  a reviewer asks is whether the generality is real: `Scheduler` on a
  module that schedules is exact, while `Scheduler` on a module that
  also dispatches commands and cancels jobs is a coordinator hiding
  behind one of its actions, and `InvoiceHandler` is the machinery
  answering for the module.
- `-er` names must now be read as claims rather than as filler. A
  reviewer who sees `PaymentManager` has a rule to cite; a reviewer who
  sees `PaymentRefunder` is being told the module refunds payments, and
  can check.
- Sentences about the system become sayable: "the invoice charger
  dispatches `ChargeInvoice`" names two things with two names.
- The rule says nothing about behavior, boundaries, or where an
  automation lives. It is a vocabulary decision, and the namespace keeps
  answering what kind of thing the module is.

## Links

- [ADR#1146361044](../1146361044/README.md): Helper vs Util
- [ADR#1394819661](../1394819661/README.md): Resource Is the Generic
  Noun, Object Is a Runtime Term
- [ADR#4615273139](../4615273139/README.md): GraphQL Resolver Naming
  Convention
- [Microsoft: CQRS pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Microsoft: Names of Classes, Structs, and Interfaces](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/names-of-classes-structs-and-interfaces)
- [Wikipedia: Agent noun](https://en.wikipedia.org/wiki/Agent_noun)
- [Wiktionary: -er](https://en.wiktionary.org/wiki/-er)
- [Elixir: `Kernel.SpecialForms.alias/2`](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#alias/2)
