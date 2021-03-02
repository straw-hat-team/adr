# URL design

* **State:** Draft
* **Created:** 2021-03-02
* **Tags:** seo, url

## Context

The lack of alignment in URL design across products causes multiple issues in
software development.

Suboptimal SEO where some Search Engines don't recognize underscores in URLs.
A URL containing "my_page" will look like "mypage." A URL containing "my-page"
will be interpreted as "my page." Or some Search Engines recognize underscores
as a separator of compound words.

Suboptimal user-experience since camelCase and underscore also require the user
to use the shift key, whereas hyphenated does not, and characters like
underscore are hidden behind special symbols in mobile phones. Or we create
unpredictable URLs; in some cases, we don't separate words or use plural form
when we meant to use single.

Lack of shared tooling, forcing developers to implement tools or promoting
bikeshedding.

## Resolution

Creating "perfect software" is close to impossible. The following suggestions
may feel like suggestions because we don't have the full scope of the situation.

Therefore, you **must** follow the following resolutions unless you have a
technical limitation. It would be best if you assumed such rules defacto in
conversations.

* You **must** use lowercase characters
* You **must** separate words using hyphenate
* You **must** use underscore for new compound words

## Links

* [Underscores vs. dashes in URLs](https://www.youtube.com/watch?v=AQcSFsQyct8&ab_channel=GoogleSearchCentral)
* [Keep a simple URL structure](https://developers.google.com/search/docs/advanced/guidelines/url-structure?hl=en&visit_id=637458734210208377-3140788082&rd=1)
