# NodeJS files and directories names conversion

* **State:** Approved
* **Created:** 2020-11-10
* **Tags:** nodejs

## Context

Across the ecosystem, we can find all sort of files and directories naming
conversions in NodeJS projects.

That has caused misalignment, shifting the focus away from more important
matters, also have created conventions that introduce problems such:

* Disagreement around the English language, making it even more difficult for the
  non-English speaker to figure out the right decision.
* Case sensitive vs. case insensitive file systems, causing issues in different
  environments such as your local computer vs. CI/CD computers.
* Format mismatching around separating English words.

The `camelCase`, and/or `PascalCase` for naming convention, although this seems
the right solution, there are some caveats.

What happens for the following cases `httpClient.ts` vs. `HTTPClient.ts` vs.
`HttpClient.ts`?

* Which one is the more appropriate choice here without getting into
  disagreement and use the phrase "it depends"?

In some cases, the file `PascalCase` is used if the file is a class or
a React component, otherwise follow `camelCase` is used.

* What happens when the file contains more than a class or a React component? How
  do we take the appropriate decision about it without getting into
  disagreement and use the phrase "it depends"?

Also, does that means that if we refactor the code and we move the React
component out of a file, that file name must change?

That would introduce more potential refactoring like renaming file paths,
adding more unnecessary lines of code changes and extra work in code reviews.

As well as issues in `CI` environments, where it may be the case that `git`
didn't rename the file due to case-insensitive file systems, and you must use
`git mv [old file] [new file]` to fix such issue.

## Resolution

File or directory names:

* Should not contain any leading or trailing spaces
* Must be lowercase i.e., no uppercase or mixed case names are allowed
* Should separate what constitutes an English word by `-`
* Should not contain any of the following characters: `~)('!*`
* Should not start with `.` or `_`
