# REST API

**Base URL:** `/api`

**Responses:**

- All bodies are JSON.
- Errors use the shape `{ "error": { "message": "...", "details": [{ "path": "...", "message": "..." }] } }`.

**Status codes:**

| Code | Meaning |
|---|---|
| 400 | Validation failed |
| 401 | Not signed in |
| 403 | Missing CSRF token, or the role is not allowed |
| 404 | Not found |
| 409 | Conflict (duplicate slug, or a media file that's still in use) |
| 413 | File too large |
| 429 | Rate limited |

**Rules for admin endpoints:**

- All admin endpoints require the session cookie.
- `POST`, `PUT`, `PATCH` and `DELETE` requests also require the `X-CSRF-Token` header. The token comes from the login response or `GET /api/auth/me`.

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{email, password}` → `{user, csrfToken}` and sets the `pf_session` cookie. Rate limited. |
| POST | `/auth/logout` | Clears the cookie |
| GET | `/auth/me` | `{user, csrfToken}` |

## Public (published content only)
| Method | Path | Notes |
|---|---|---|
| GET | `/public/settings` | Site settings (branding, theme, contact, social, header, footer, SEO) |
| GET | `/public/navigation` | `{main, footer}`: visible items only; links to unpublished pages are removed |
| GET | `/public/pages` | List of published pages |
| GET | `/public/pages/:slug` | Published content; hidden sections are removed. The home page uses the slug `home`. |
| GET | `/public/projects?featured=true&category=&limit=` | Published projects |
| GET | `/public/projects/:slug` | Published project with `prev` and `next` links |
| GET | `/public/skills` | Visible skills |
| GET | `/public/experience` | Visible experience entries |
| GET | `/public/redirects/resolve?path=/old` | `{to, statusCode}` or 404 |
| POST | `/public/track` | `{kind: 'view'|'resume', path}` → 204. Privacy-friendly counter: daily totals only, no personal data. Bots, Do-Not-Track/GPC visitors and signed-in admins are skipped. Rate limited. |
| POST | `/public/contact` | `{name, email, subject?, message}`. Validated, honeypot-protected and rate limited. |
| GET | `/health` | `{ok, mediaProvider, emailEnabled}` |

These responses send `Cache-Control: public, max-age=0, must-revalidate` with an ETag, so browsers reuse responses with a 304 until the content changes.

## Admin
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard` | Counts and recent activity |
| GET | `/admin/analytics?days=7|30|90` | Daily page views and CV downloads, totals vs the previous period, top pages |
| GET | `/admin/section-types` | Default data and style for every section type |
| GET / POST | `/admin/pages` | List or create `{title, slug, pageType, template}` |
| GET / PUT / DELETE | `/admin/pages/:id` | Get the full document, update `{slug?, pageType?}` (a slug change creates a redirect), or delete |
| PUT | `/admin/pages/:id/draft` | `{title, seo, sections}`. Saves the draft only. |
| GET | `/admin/pages/:id/preview` | The draft, in the same shape as the public page |
| POST | `/admin/pages/:id/publish` | `{note?}`. Copies the draft live and records a revision. |
| POST | `/admin/pages/:id/unpublish` · `/discard` | Hide the page, or reset the draft to the published version |
| GET | `/admin/pages/:id/revisions` | Revision list |
| POST | `/admin/pages/:id/revisions/:revId/restore` | Loads the revision into the draft |
| PUT | `/admin/pages/:id/seo` | `{seo}` → saved to the draft |
| GET / POST | `/admin/projects` | List or create |
| PUT | `/admin/projects/reorder` | `{ids: [...]}` |
| GET / PUT / DELETE | `/admin/projects/:id` | |
| GET | `/admin/projects/:id/revisions` | |
| GET / POST · PUT reorder · GET / PUT / DELETE `:id` | `/admin/skills`, `/admin/experience` | Same pattern as projects |
| GET | `/admin/media?q=&type=image\|document\|all&page=&limit=` | Search the library |
| POST | `/admin/media` | multipart `files` (up to 10 per request) |
| PATCH / DELETE | `/admin/media/:id` | Update `{alt, caption}`, or delete (`?force=true` overrides the in-use check) |
| GET | `/admin/media/:id/usage` | Where the file is referenced |
| GET / PUT | `/admin/navigation` | `{main?, footer?}` |
| GET / PUT | `/admin/settings` | Full settings object (admin role only) |
| GET | `/admin/revisions?contentType=page\|project\|settings\|navigation&contentId=` | |
| GET / POST | `/admin/revisions/:id` · `/admin/revisions/:id/restore` | View or restore a revision |
| GET | `/admin/seo` | SEO overview of pages, projects and redirects |
| POST / DELETE | `/admin/redirects` · `/admin/redirects/:id` | Manual redirects |
| GET | `/admin/messages?status=&page=` | |
| PATCH / DELETE | `/admin/messages/:id` | Update `{status}`, or delete |
| GET / POST / PUT / DELETE | `/admin/users[/:id]` | Admin role only. The last active admin can't be removed. |

## Other routes
- `GET /sitemap.xml` lists published pages and projects, excluding any marked noindex.
- `GET /robots.txt` blocks `/admin`, `/preview` and `/api`, or blocks everything when indexing is turned off.
- `GET /uploads/*` serves locally stored media.
