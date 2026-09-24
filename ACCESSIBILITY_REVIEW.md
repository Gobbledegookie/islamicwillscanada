# Accessibility review — September 2026

The site-owned interface was reviewed against WCAG 2.2 AA criteria relevant to this update. This is a record of checks, not a claim that automated testing alone proves full conformance.

## Changes

- Raised visible site text to at least 16 CSS pixels, including navigation, footer, document labels, directory notes and button text.
- Added a dark theme that follows the operating-system preference until a visitor chooses a theme. The choice persists across pages. The toggle exposes its state with `aria-pressed` and is keyboard operable.
- Gave the workshop and each seminar a titled, lazy-loaded YouTube iframe plus a direct YouTube link. The workshop appears before the five-step guide.
- Kept semantic headings and lists, visible focus outlines, the skip link, mobile navigation and reduced-motion handling.

## Checks

| Check | Result |
| --- | --- |
| WCAG 2.2 AA text contrast threshold | Primary and muted body text exceed 4.5:1 in light and dark sections. The lowest checked body-text pair is muted text on the light wash at 5.61:1. |
| Controls and focus indicators | Light control border is 4.49:1 against paper; dark control border is 7.82:1. Focus outline is 5.05:1 on light paper and 9.52:1 on dark paper. |
| Text size and narrow viewport | All seven pages had no visible site text below 16px. The seminar and creation pages were checked at a 320px viewport with no horizontal overflow; video players remain at least 200px high. All seven pages were also checked for overflow at phone width. |
| Automated accessibility scan | axe-core 4.13 found zero violations on all seven pages when excluding the cross-origin YouTube player internals. Home also had zero with no exclusions. |
| Theme and navigation interaction | Checked light and dark rendering, dark-mode persistence after reload, and mobile navigation at narrow width. |

The contrast calculations use the [WCAG contrast formula and 4.5:1 / 3:1 AA thresholds](https://www.w3.org/TR/wcag/#contrast-minimum). The site also follows the [operating-system color preference](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) and advertises the active control color scheme.

## Video-media dependency

An axe scan *including* the embedded YouTube document reported ARIA and button-name issues inside YouTube's cross-origin player. The site cannot change that player markup. The videos' caption quality, transcripts and any visual information requiring audio description also need review with the video owners before the video content can be certified to [WCAG prerecorded-media requirements](https://www.w3.org/WAI/media/av/description/). The direct YouTube links and companion materials remain available, but they are not a substitute for verified captions and descriptions.
