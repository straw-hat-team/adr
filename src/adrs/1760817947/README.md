---
id: '1760817947'
title: URL Structure Design as an Architectural Decision
state: Draft
created: 2025-10-18
tags: [url-design, architecture, performance, seo]
category: Platform
---

# URL Structure Design as an Architectural Decision

## Context

URL design is often treated as a purely aesthetic or SEO decision, focusing on
user-friendly, clean URLs like `/nike-air-zoom` or `/summer-collection` without
prefixes. However, this seemingly simple choice has significant architectural
implications that affect:

- **Backend query patterns**: Flat URLs require resolution logic to determine entity types
- **Application performance**: Additional API calls to resolve ambiguous URLs
- **Infrastructure costs**: Increased backend load from redundant lookups
- **Cache complexity**: Need for sophisticated caching strategies
- **Development effort**: Additional code to maintain slug uniqueness and resolution

The article "[The Hidden Cost of URL Design](https://alfy.blog/2025/10/16/hidden-cost-of-url-design.html)"
presents a case study where flat URLs (`/leather-jacket`) caused 2x backend load
because the system couldn't determine if a slug represented a product, category,
page, or 404 without querying multiple endpoints.

### The Core Problem

With flat URLs like `/leather-jacket`, applications cannot deterministically
know the entity type, requiring:

```javascript
// Flat URL - requires resolution
path = "/leather-jacket"
isProduct = await checkIfProduct(slug)
if (isProduct) return renderProduct()

isCategory = await checkIfCategory(slug) 
if (isCategory) return renderCategory()

return render404()
```

With structured URLs like `/product/leather-jacket`, routing is immediate:

```javascript
// Structured URL - instant routing
path = "/product/leather-jacket"
prefix = path.split("/")[1]  // "product"
// Route directly to product handler
```

### Real-World Impact

The case study documented:

- **Every valid page**: 2 backend API calls (one succeeds, one fails)
- **Every 404**: 2 wasted backend calls (both fail)
- **Bot traffic**: 30% of requests generating double load
- **P95 latency**: 800ms-1.2s during peak traffic
- **Infrastructure costs**: 40% higher than projected

## Decision Drivers

- **Backend architecture compatibility**: Does the backend provide unified URL resolution?
- **Performance requirements**: What latency and throughput is acceptable?
- **SEO considerations**: Are flat URLs measurably better for search ranking?
- **Development velocity**: How much time can be invested in resolution logic?
- **Infrastructure budget**: Can additional caching/compute costs be justified?
- **Slug collision risk**: Can uniqueness be enforced across entity types?

## Considered Options

### Option 1: Flat/Clean URLs

Use URLs without type prefixes: `/nike-air-zoom`, `/shoes`, `/about-us`

- **Good**, because URLs are aesthetically cleaner
- **Good**, because some studies suggest minor SEO benefits
- **Good**, because URLs feel more intuitive to users
- **Bad**, because requires resolution logic to determine entity type
- **Bad**, because necessitates multiple backend queries per request
- **Bad**, because increases infrastructure costs significantly
- **Bad**, because requires sophisticated caching strategies
- **Bad**, because must enforce slug uniqueness across all entity types
- **Bad**, because makes debugging and monitoring more complex

**When viable**: 
- Backend has SEF (Search Engine Friendly) URL tables for single-query resolution
- Traffic volume justifies optimization investment
- Team has capacity to build/maintain resolution infrastructure

### Option 2: Structured/Prefixed URLs

Use URLs with type indicators: `/product/nike-air-zoom`, `/category/shoes`, `/page/about-us`

- **Good**, because routing decisions are instantaneous
- **Good**, because requires only one backend call per request
- **Good**, because allows independent slug namespaces per type
- **Good**, because simplifies caching strategies (can cache by URL pattern)
- **Good**, because reduces infrastructure costs
- **Good**, because makes monitoring and debugging straightforward
- **Good**, because easier to implement and maintain
- **Bad**, because URLs are slightly longer
- **Bad**, because perceived as less clean/modern
- **Bad**, because harder to change later (requires redirects)

**When viable**:
- Backend has separate endpoints per entity type
- Performance and cost efficiency are priorities
- Team wants to minimize complexity

### Option 3: Hybrid Approach

Use flat URLs with query parameters for internal navigation: `/nike-air-zoom?t=p`

- **Good**, because external URLs remain clean for SEO/sharing
- **Good**, because internal navigation can bypass server-side resolution
- **Good**, because can be implemented without URL changes
- **Good**, because reduces server-side resolution by 70-80%
- **Bad**, because adds complexity to routing logic
- **Bad**, because requires careful cache key management
- **Bad**, because query parameters visible during SPA navigation
- **Bad**, because still requires resolution for initial page loads

**When viable**:
- Legacy system with established flat URLs
- Cannot change existing URL structure
- Most traffic is internal navigation after landing

## Decision Outcome

We **RECOMMEND** Option 2 (Structured URLs) as the default choice for new
projects because it:

- Aligns URL structure with backend capabilities
- Minimizes technical complexity and infrastructure costs
- Provides deterministic routing without resolution overhead
- Simplifies caching, monitoring, and debugging
- Allows easier future optimization if needed

Teams **MAY** choose Option 1 (Flat URLs) if:

- They explicitly budget for resolution infrastructure
- Backend provides unified URL resolution (SEF tables)
- Measurable business value (SEO/brand) exceeds technical costs
- Team documents the decision and trade-offs in an ADR

Teams **SHOULD** consider Option 3 (Hybrid) only for:

- Existing systems with established flat URL patterns
- Migration scenarios where URL changes are too costly
- Cases where internal navigation dominates traffic patterns

### Implementation Guidance

When implementing structured URLs, teams **SHOULD**:

1. **Choose consistent prefixes** that map to backend entity types
2. **Document the URL structure** in API documentation
3. **Configure CDN caching** rules based on URL prefixes
4. **Set up monitoring** for each URL prefix pattern
5. **Plan for future flexibility** with versioning strategy

When implementing flat URLs, teams **MUST**:

1. **Build or verify URL resolution endpoint** exists in backend
2. **Implement caching layer** for resolved slugs
3. **Enforce slug uniqueness** across all entity types at database level
4. **Budget additional infrastructure** for resolution queries
5. **Monitor resolution performance** and costs continuously
6. **Document the trade-offs** accepted for business goals

### Advantages

- **Performance**: Reduces unnecessary backend calls by 50% (structured) to 100% (with caching)
- **Cost efficiency**: Lower infrastructure costs from reduced query volume
- **Simplicity**: Less code to write, test, and maintain
- **Reliability**: Fewer moving parts means fewer failure modes
- **Developer experience**: Easier onboarding and debugging

### Disadvantages

- **URL length**: Structured URLs are longer (marginal UX impact)
- **Flexibility**: Harder to change URL structure after launch
- **Perception**: May be perceived as less modern/clean

### Migration Path

Projects with existing flat URLs **SHOULD NOT** rush to restructure unless:

- Infrastructure costs are unsustainable
- Performance issues are impacting users
- Resolution complexity is blocking development

Instead, consider:

1. Implementing hybrid approach (Option 3) first
2. Adding caching layers to reduce resolution cost
3. Planning gradual migration with proper redirects
4. Measuring business impact before/after changes

## Links

- [The Hidden Cost of URL Design](https://alfy.blog/2025/10/16/hidden-cost-of-url-design.html) - Original case study
