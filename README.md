# Islamic Will Canada

Source repository for the planned [islamicwillcanada.pages.dev](https://islamicwillcanada.pages.dev) site. The site presents Islamic Will Canada's guidance and resources in a clearer layout. See [CONTENT_AUDIT.md](CONTENT_AUDIT.md) for the content inventory and items needing review.

## Stack and structure

- Static HTML, CSS and a small amount of vanilla JavaScript. No runtime dependencies, server, database, or credentials.
- `src/build.js`: shared page shell, navigation, components, resource links and content.
- `public/assets`: styles, mobile navigation script, SVG identity and optimized team portraits.
- `public/robots.txt` and generated `sitemap.xml`.
- `dist/`: generated output; deliberately ignored by Git.

The site uses one generated HTML file per route, so all substantive content is available without JavaScript. The only browser script toggles the mobile navigation. There is no contact form or online will creation form; visitors use the email, document, seminar and group links.

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
| Project | `islamicwillcanada` |
| Framework preset | None |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Environment variables | None |

The Pages project must be created with Git integration from the `main` branch of [Gobbledegookie/islamicwillscanada](https://github.com/Gobbledegookie/islamicwillscanada). Cloudflare will then build and deploy new commits automatically using the settings above.

**Deployment status:** The code is pushed to GitHub, but the new Pages project has not been created. Cloudflare returned error `8000011` (“There is an internal issue with your Cloudflare Pages Git installation”) when creating a Git-connected project. Repair or reinstall the Cloudflare Pages GitHub app and grant it access to this repository, then create the project with the settings above. Do not create this host as a Direct Upload project: Cloudflare cannot later convert it to Git integration.

Canonical URLs and sitemap entries use the default `pages.dev` domain. If a custom domain is attached, update `base` in `src/build.js` and the sitemap URL in `public/robots.txt` before deploying.

## Content maintenance

External documents and community links remain hosted by their respective owners. Check them periodically. Before changing the will method, legal wording, religious citations, directory contacts, or pricing, confirm the new information with the initiative's maintainers.
