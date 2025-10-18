---
id: '1760817947'
title: Prefer Structured URLs Over Flat URLs
state: Approved
created: 2025-10-18
tags: [url-design, architecture, performance, seo]
category: Platform
---

# Prefer Structured URLs Over Flat URLs

## Context

URL design is often treated as a purely aesthetic or SEO decision. Teams favor
"clean" flat URLs like `/nike-air-zoom` over structured URLs like
`/product/nike-air-zoom`. However, flat URLs have significant architectural
costs that are often overlooked.

With flat URLs, applications cannot determine the entity type from the path
alone, requiring resolution queries:

```javascript
// Flat URL - requires resolution
const slug = path.split('/')[1];

const product = await getProduct(slug);
if (product) return renderProduct(product);

const category = await getCategory(slug);
if (category) return renderCategory(category);

return render404();
```

With structured URLs, routing is deterministic — no resolution needed:

```javascript
// Structured URL - instant routing
const prefix = path.split('/')[1]; // "product"
// Route directly to product handler
```

A case study documented the real-world impact: every page required 2 backend
calls (one succeeds, one fails), 404s wasted 2 calls each, and infrastructure
costs were 40% higher than projected.

Flat URLs also require enforcing slug uniqueness across all entity types at the
database level — a product and category cannot share the same slug. Structured
URLs allow independent namespaces per type.

## Resolution

- You **SHOULD** use structured/prefixed URLs for new projects (e.g., `/p/slug` or `/product/slug`).

## Links

- [The Hidden Cost of URL Design](https://alfy.blog/2025/10/16/hidden-cost-of-url-design.html) - Case study referenced in Context
