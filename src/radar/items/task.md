---
name: Task
quadrant: tools
history:
  - edition: '2026.2'
    ring: hold
tags: [developer-experience, task-runner]
---

# Task

Task is a task runner configured through a `Taskfile.yml`. It does that job well, and it was the job we hired it
for.

It is on Hold because it only ever covered half of the problem. A Taskfile says how to build, test, and release a
project; it says nothing about which toolchain versions those commands assume, so every repository carried a
second mechanism for that and a README paragraph asking contributors to keep the two in agreement. [mise](./mise.md)
collapses both into one declaration, which removes the drift rather than documenting it.

Hold is not a removal order. A repository still using a Taskfile is not broken, and there is no value in churning
one just to change the file name. New repositories should not add one.
