# Inspection Report — Developer Portfolio + Visual CMS

Date: 2026-10-29

## 1. What exists today

| Item | Finding |
|---|---|
| Project files | Only `instructions.md`. No code, no `package.json`, no git repo. Nothing to preserve or migrate. |
| Node.js / npm | v22.22.0 / 10.9.4 — fine for Vite 6+, Express 5, Mongoose 8. |
| git | 2.53 installed; the folder is **not** a repository yet. |
| MongoDB | Server 8.2.5 running as Windows service `MongoDB` on `127.0.0.1:27017`, no auth. `mongosh` available. Database `developer_portfolio` does not exist yet, so there's no collision with the other local databases (`leoprinting`, `pms`, `website_builder`, …). |
| Port 5000 | **Taken** by `wslrelay.exe` (WSL). The API will use **5050** instead. 5173 (Vite) is free. |
| Docker | Not installed. Not needed. |
| Cloudinary | No credentials in the environment. Uploads default to a real **local disk** provider; Cloudinary works once its env vars are set but **cannot be verified here**. |
| SMTP | No credentials. Contact messages are always stored in MongoDB; email notification only runs when SMTP is configured. |

## 2. Proposed architecture

```
dynamic-portfolio/
├── package.json        root scripts (dev runs both apps via concurrently)
├── server/             Express 5 + Mongoose 8 REST API (port 5050)
│   ├── config/         env validation (zod), db connection
│   ├── models/         User, Page, Project, Skill, Experience, Media,
│   │                   Navigation, WebsiteSettings, ContactMessage, Revision, Redirect
│   ├── sections/       one validated schema per section type (shared source of truth)
│   ├── controllers/ routes/ services/ middleware/ validators/
│   ├── scripts/        create-admin.js, seed.js
│   └── tests/          Vitest + Supertest against a separate test database
├── client/             React + Vite + Tailwind + React Router (port 5173, proxies /api)
│   ├── src/components/sections/   one renderer per section type
│   ├── src/pages/                 public pages (slug-driven)
│   └── src/admin/                 dashboard, visual editor, managers
└── docs/               architecture.md, api.md, setup.md
```

### Key design decisions

- **Auth:** bcrypt password hashes and a JWT in an **HTTP-only, SameSite=Lax cookie**, with a double-submit **CSRF token** required on every state-changing admin request. Nothing goes in localStorage. There is no public registration; the first admin is created with `npm run create-admin`.
- **Draft/publish:** each `Page` holds separate `draft` and `published` section arrays. Saving a draft never touches `published`. Publishing copies the draft and writes a `Revision` snapshot, and any revision can be restored into the draft. Public endpoints only read `published` and only return pages with status `published`.
- **Sections:** a fixed set of section types: hero, about, skills, projects, experience, stats, cta, contact, textImage, testimonials and resume. Each type has a server-side zod schema and a matching React renderer. Arbitrary HTML is not allowed, and rich text is sanitized on the server.
- **Visual editor:** the left sidebar lists sections and supports drag-and-drop ordering, visibility and add/duplicate/delete. The centre shows an **iframe preview** at real desktop, tablet and mobile widths, which receives the unsaved draft through `postMessage`. Clicking a highlighted element in the preview selects its section and field. The right sidebar holds the properties panel: text, a rich-text editor, an image picker, buttons and style options.
- **Media:** a provider abstraction, selected with `MEDIA_PROVIDER=local|cloudinary`. Only metadata goes to MongoDB. File type is checked by MIME type and magic bytes, and there is a size limit.
- **Theme:** settings are stored in MongoDB and applied as CSS variables, chosen from preset options. Arbitrary CSS is not allowed.
- **SEO:** each page and project gets its own title, description, canonical URL and Open Graph tags. The server also provides `sitemap.xml`, `robots.txt` (which disallows `/admin`) and a redirect table that fills automatically when a slug changes. In production, Express serves the built client and injects per-route meta tags into the HTML so crawlers see real metadata.
- **Security:** helmet, CORS restricted to `CLIENT_URL`, rate limits on login and contact, a NoSQL operator sanitizer, a honeypot field for spam, URL protocol allow-listing (blocks `javascript:` and `data:`), and no stack traces in production.
- **Testing:** server tests use Vitest and Supertest on `developer_portfolio_test`. Client tests use Vitest and Testing Library.

## 3. Constraints & risks

1. **Cloudinary and SMTP can't be verified** without credentials. The code paths will be implemented and documented, but not claimed as working.
2. The app runs entirely on client-side rendering, plus server-injected meta tags in production. Full SSR is out of scope.
3. Port 5050 is used instead of 5000 because of the WSL conflict. It can be changed with `PORT`.
4. Sample content is clearly labelled as placeholder. It doesn't invent employers, education or qualifications.

## 4. Build order

Follows section 19 of the instructions: foundation → public site → auth → CMS models/admin → media + visual editor → publishing/revisions → SEO/theme/messages → tests and verification.
