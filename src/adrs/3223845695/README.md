---
id: '3223845695'
title: Documentation structure
state: Approved
created: 2021-12-21
tags: [documentation]
category: General
---

# Documentation structure

## Context

Getting documentation right is a key part of the development process, but that
is rarely the case. Most people lack of the discipline or the ability to write
good documentation.
More often than not, the documentation is written in a style that complex
different concerns.
Or the structure of the documentation website is customized so much that readers
must understand what is what.

As of today, [Diátaxis Framework](https://diataxis.fr/) has been successfully
implemented in projects such as: [Django](https://www.djangoproject.com/) or
[Gatsby](https://www.gatsbyjs.com/docs/).

The framework may not perfect, but it is a good starting point. The project
love collaboration and is open to contributions. Recommend collaborating and
align with such project.

## Resolution

- You **MUST** follow the [Diátaxis Framework](https://diataxis.fr/) writing
  documentation.
- Your Top-Level Documentation structure or navigation **MUST** include the
  following:
  - Tutorials or Tutorial
  - How-to Guides or How-tos
  - References or Reference
  - Explanations or Explanation

### Example

```markdown
# My Project

## Documentation

- [Tutorials](./docs/tutorials/README.md)
- [How-tos](./docs/how-tos/README.md)
- [References](./docs/references/README.md)
- [Explanations](./docs/explanations/README.md)
```

## Links

- [Diátaxis Framework](https://diataxis.fr/)
