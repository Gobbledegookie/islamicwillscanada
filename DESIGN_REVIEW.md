# Design review: September 2026

This review compares the first GitHub-connected release with the editorial revision. It concerns visual presentation and wayfinding; CONTENT_AUDIT.md remains the record of substantive information and unresolved factual issues.

## What made the first release feel generated

| Before | Why it weakened this site | After |
| --- | --- | --- |
| Five identical rounded step cards with large gold 01–05 glyphs | The number treatment drew more attention than the instructions and made a real process look like a generic feature grid. | A plain ordered list retains the sequence and puts the step title and instruction first. |
| Another row of three numbered resource cards | The same visual pattern was reused for links, although those items are destinations rather than steps. | Descriptive links and summaries appear in a ruled directory. |
| Decorative crescent, star mark, gradient panel and invented sentiment in the hero | Ornament occupied valuable space without helping visitors start a will or understand the initiative. | A direct introduction, two task links and a factual note about the volunteer initiative. |
| Three matching seminar cards and repeated bordered content cards | Recordings, documents, people and contact methods were all made to look alike despite having different purposes. | Recordings use a dated list; documents use linked titles; the directory and team use open rows and photographs. |
| All-caps eyebrow text in almost every section, heavy rounded corners, soft shadows, and arrows on buttons | These repeated motifs made the presentation feel templated and competed with the information. | Sentence-case labels where useful, restrained rules, square controls and descriptive link text. |
| Remote decorative fonts | They added visual flourish and a font request without improving the guidance. | System sans and Georgia keep the reading experience familiar and fast. |

## Design principles used

- Prioritize the visitor's tasks: understanding the purpose, reading the method, opening the template, and contacting the team.
- Give a step list, document index, recording list, directory, FAQ and team page distinct layouts that suit their content.
- Use visual hierarchy from text size, whitespace and rules. Avoid decoration that does not convey information.
- Keep every factual claim, date, name, contact, downloadable document and external resource from the first release.
- Preserve semantic ordered lists, headings, navigation, focus states and responsive behavior.

The [Canada.ca content design guidance](https://design.canada.ca/designing-content.html) emphasizes task completion, findability, comprehension and trust. Its [services and information pattern](https://design.canada.ca/common-design-patterns/services-information.html) recommends linked headings with descriptions for navigation choices. Its [subway navigation research](https://design.canada.ca/common-design-patterns/subway-navigation.html) cautions against decorative numbering for navigation. The site still uses ordinary numbers where they convey the order of the actual will-writing process.

## Verification

- Compared the previous and revised builds: every page retained the same link destinations. No link keys, email addresses, years or telephone numbers were removed.
- The ornamental 01–05 badges were removed; the five-step content and order remain.
- Built all seven pages and the 404 page locally.
- Checked phone-width pages for one H1 and horizontal overflow; checked mobile navigation and the seminar and directory layouts visually.
- Production deployment and URL checks are recorded separately when the revision is released.
