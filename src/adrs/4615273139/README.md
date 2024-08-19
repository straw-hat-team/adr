---
id: '4615273139'
title: GraphQL Resolver Naming Convention
state: Approved
created: 2024-08-10
tags: [ elixir, absinthe, graphql, naming ]
category: Elixir
---

# GraphQL Resolver Naming Convention

## Context

A consistent naming convention for the resolvers is essential. That makes it
easier to understand and maintain the code in the future without spending time
bike-shedding over the naming and structure of the resolvers.

### God-Module

There is a well-known anti-pattern in the industry called the "God Object"
promoted by Phoenix; we call it "Context," which indirectly leads to developers
creating one God-Module for resolvers.

In Phoenix and GraphQL, resolvers have been an ever-growing pain.

Defining the "Context" is not straightforward, especially in CRUD-based
development, leading to bike-shedding. This is especially true in GraphQL, where
we have a Graph, and data travels in and out of multiple "Contexts."

As the system grows, the God Module becomes more challenging to maintain and
understand. Scrolling through hundreds of lines of code to find the resolver you
seek could be a better experience. Functions need more practical names. And even
worse, maintaining the test suite becomes a nightmare.

### Focusing on Use Cases

Giving the use case its module following the same Interface/Behaviour allows
Platform-Level indirection to wrap the Product-Level code, especially when the
resolver concerns a specific use case and not the entity/data.

Adding caching, a11y, or other concerns becomes easier; the module name becomes
the identity (as if it were the Message Type) the Platform Level code can
leverage.

Since the resolvers are not shared, we are applying the practical
Single-Responsibility Principle and DRY Principle; the intent was always about

Use Cases since that is ultimately what the system is about.

> "A system is what the system does, not by its classification. Its capabilities
> derive classifications." Yordis Prieto

### A Graph

Having a graph reduces the complexity of two dimensions (Nodes and fields), and
the naming convention should reflect that. Everything starts with finding the
Nodes and Fields when troubleshooting, debugging, adding, removing, modifying,
or updating.

The naming should make it easier to find the resolver you are looking for by
looking at the graph.

We have tried naming around the Node only in the past, such as:

- `List[Plural Resource Name]`
- `Get[Singular Resource Name]`
- `List[Plural Resource Name]Of[Parent Resource Name]`
- `Get[Singular Resource Name]Of[Parent Resource Name]`

The problem is that it is impossible since you could have multiple fields that
return the same type, and the focus should be on the field, not the return type.

Likewise, List or Get is less relevant than the field name to identify the
resolver's purpose.

## Resolution

- You **MUST** define a module per resolver.
- You **MUST** use the field name as the module name.
- You **MUST** use the field name and the parent name as the module name if the
  field is nested under an object. You **MUST** use
  `[Field Name]Of[Parent Object Name]` as the module name.
- You **MUST** use `resolve/3` as the resolver function name.
- You **MAY** use `Mutation.` or `Query.` module prefixes to separate the
  mutations and queries under two different modules.
- You **MUST** use the `Batch` prefix for batch mutations.

### Example

```elixir
defmodule Umbrella.Web.Graphql.Schema do
  alias Umbrella.Web.Graphql.Resolver.{
    Mutation,
    Query
  }

  enum :transaction_status do
    # ...
  end

  object :transaction do
    field :status, :transaction_status do
      resolve &Query.StatusOfTransaction.resolve/3
    end
  end

  object :transfer do
  end

  object :user do
  end

  object :deposit_account do
    field :primary_owner, :user do
      resolve &Query.PrimaryOwnerOfDepositAccount.resolve/3
    end
    field :transactions, list_of(:transaction) do
      resolve &Query.TransactionsOfDepositAccount.resolve/3
    end
  end

  query do
    field :deposit_account, non_null(:deposit_account) do
      resolve &Query.DepositAccount.resolve/3
    end
  end

  mutation do
    field :initiate_transfer, non_null(:transfer) do
      resolve &Mutation.InitiateTransfer.resolve/3
    end
  end
end
```

## Links

- [God Object](https://en.wikipedia.org/wiki/God_object)
