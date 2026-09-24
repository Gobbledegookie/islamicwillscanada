# Islamic Will Canada

Production site for [islamicwillscanada.pages.dev](https://islamicwillscanada.pages.dev). This rebuild preserves the substantive guidance and links from the [original Google Sites website](https://sites.google.com/view/islamicwillcanada) while making the material easier to read and navigate. See [CONTENT_AUDIT.md](CONTENT_AUDIT.md) for the source inventory and items needing review.

## Stack and structure

- Static HTML, CSS and a small amount of vanilla JavaScript. No runtime dependencies, server, database, or credentials.
- `src/build.js`: shared page shell, navigation, components, source links and content.
- `public/assets`: styles, mobile navigation script, SVG identity and optimized team portraits.
- `public/robots.txt` and generated `sitemap.xml`.
- `dist/`: generated output; deliberately ignored by Git.

The site uses one generated HTML file per route, so all substantive content is available without JavaScript. The only browser script toggles the mobile navigation. The source site contains no contact form or online will creation form; the original email, document, seminar and group links are retained.

## Local development

Install Node.js 20 or later, then:

```sh
npm run build
npx wrangler pages dev dist
```

Run `npm run build` after editing `src/build.js` or `public/`. The local server reports its address in the terminal. No environment variables are needed.

## Deployment

Cloudflare Pages settings:

| Setting | Value |
| --- | --- |
| Project | `islamicwillscanada` |
| Framework preset | None |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Environment variables | None |

For a direct deployment, run `npm run build` and `npx wrangler pages deploy dist --project-name islamicwillscanada --branch main`. A Git connected Pages project can use the settings above for automatic deployments.

This Pages project currently uses Direct Upload. An attempt to create a Git-integrated Pages project through the Cloudflare API returned an internal Git installation error from the connected Cloudflare account. Cloudflare does not allow converting an existing Direct Upload project to Git integration; after that installation is repaired, the project would need to be recreated with Git integration, or a separate CI workflow can deploy through Wrangler. No Cloudflare API token or GitHub secret is stored in this repository.

Canonical URLs and sitemap entries use the default `pages.dev` domain. If a custom domain is attached, update `base` in `src/build.js` and the sitemap URL in `public/robots.txt` before deploying.

## Content maintenance

External documents and community links remain hosted by their original owners. Check them periodically. Before changing the will method, legal wording, religious citations, directory contacts, or pricing, confirm the new information with the initiative's maintainers; the source site is the content authority for this rebuild.
