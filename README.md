# Islamic Will Canada

Source repository for [islamicwillcanada.pages.dev](https://islamicwillcanada.pages.dev). The site presents Islamic Will Canada's guidance and resources in a clearer layout. See [CONTENT_AUDIT.md](CONTENT_AUDIT.md) for the content inventory and items needing review, [DESIGN_REVIEW.md](DESIGN_REVIEW.md) for the visual before-and-after analysis, and [ACCESSIBILITY_REVIEW.md](ACCESSIBILITY_REVIEW.md) for accessibility checks and remaining video-media work.

## Stack and structure

- Static HTML, CSS and a small amount of vanilla JavaScript. No runtime dependencies, server, database, or credentials.
- `src/build.js`: shared page shell, navigation, components, resource links and content.
- `public/assets`: styles, mobile navigation script, SVG identity and optimized team portraits.
- `public/robots.txt` and generated `sitemap.xml`.
- `dist/`: generated output; deliberately ignored by Git.

The main site uses one generated HTML file per route, so its substantive content is available without JavaScript. The browser script toggles the mobile navigation and powers the round color-mode menu (System by default, with saved Light or Dark overrides). Workshop and seminar videos use lazy-loaded YouTube embeds with direct video links as alternatives. There is no contact form; visitors use the email, document, seminar and group links.

## Guided will experiment

`/interactive/` is a standalone experiment based on the Windsor Islamic Association DOCX template. It groups the template's questions into nine sections and generates a filled DOCX or PDF draft in the browser. A test button fills all sections with fictional details, opens the review step, and marks sample downloads. The Article 1 address field sends the text being typed directly to Komoot’s public Photon service for Canadian suggestions; no name or other will answer is attached. Normal connection details, including the visitor’s IP address, may accompany the request, and Komoot says it retains request logs for a limited time. The rest of the answers are not sent to a server. The form does not create an account or save progress; closing or reloading the tab discards entered answers. The form asks for the people and details needed to fill the draft but does not calculate inheritance shares or determine legal validity. The exported document still needs full review and signing.

The Windsor template's front matter, articles and inheritance appendix are transcribed into `src/interactive/windsor-*.json`; `model.js` inserts answers into those clauses and adds the finance schedules. `app.js` handles the guided questions and validation. The export modules render DOCX with `docx` and PDF with `pdf-lib`. They preserve the sample's section hierarchy, Arabic artwork, tables, filled-answer emphasis, page numbering and signing space. The sample's yellow editing notes are omitted because they instruct the reader to delete them. Document libraries load only when a visitor downloads a file. The PDF uses self-hosted Noto Sans fonts; their [Open Font License](licenses/NotoSans-OFL.txt) is included. See [INTERACTIVE_NOTES.md](INTERACTIVE_NOTES.md) for the template mapping and known review points. The homepage links to this guided route as its primary action.

## Local development

Install Node.js 20 or later, then:

```sh
npm ci
npm run build
npx wrangler pages dev dist
```

Run `npm run build` after editing `src/build.js` or `public/`. The local server reports its address in the terminal. No environment variables are needed.

## Deployment

Cloudflare Pages settings:

| Setting | Value |
| --- | --- |
| Project | `islamicwillcanada` |
| Framework preset | None |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Environment variables | None |

The Pages project is connected to the `main` branch of [Gobbledegookie/islamicwillscanada](https://github.com/Gobbledegookie/islamicwillscanada). New commits to `main` trigger Cloudflare builds and deployments automatically.

**Deployment status:** The GitHub-connected project is live at [islamicwillcanada.pages.dev](https://islamicwillcanada.pages.dev). The initial production deployment completed successfully.

Canonical URLs and sitemap entries use the default `pages.dev` domain. If a custom domain is attached, update `base` in `src/build.js` and the sitemap URL in `public/robots.txt` before deploying.

## Content maintenance

External documents and community links remain hosted by their respective owners. Check them periodically. Before changing the will method, legal wording, religious citations, directory contacts, or pricing, confirm the new information with the initiative's maintainers.
