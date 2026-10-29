# Architecture

```
Browser ──► Vite dev server (5173) ──proxy /api,/uploads──► Express API (5050) ──► MongoDB
             │                                              │
             ├─ public site  (/ , /:slug, /projects/:slug)  ├─ /api/public/*  published content only
             ├─ /preview/:id (admin only, draft)            ├─ /api/auth/*    session cookie + CSRF token
             └─ /admin/*     (lazy-loaded bundle)           ├─ /api/admin/*   requireAuth + requireCsrf (+ role)
                                                            └─ /sitemap.xml, /robots.txt, /uploads/*
```

In production, Express also serves `client/dist` and injects per-route SEO tags into `index.html` (`services/seo.js`).

## Content model

| Model | Notes |
|---|---|
| `Page` | Holds `draft` and `published` content separately (`{title, seo, sections[]}`), plus `status`, `version`, `hasUnpublishedChanges` and `slug`. The home page is always served at `/`. |
| `Project` | Has a `draft` or `published` status, plus a `featured` flag, display `order` and its own SEO. A revision is stored on every save. |
| `Skill`, `Experience` | Ordered collections with a `visible` flag. |
| `Media` | Stores metadata only (url, storageKey, provider, mime, size, dimensions, alt, caption). The binaries live on local disk or in Cloudinary. |
| `Navigation` | Two menus, `main` and `footer`. Items carry `parentId`, so a menu can have one level of dropdowns. |
| `WebsiteSettings` | A single document holding branding, theme, contact details, social links, header, footer, SEO defaults and the résumé link. Its shape is enforced by zod. |
| `Revision` | Immutable snapshots for pages (on publish), projects, settings and navigation (on save). The last 50 are kept per item. |
| `ContactMessage` | Stores a status (`new`, `read`, `replied`, `archived` or `spam`) and a keyed hash of the sender's IP address, never the raw IP. |
| `Redirect` | Old path → new path. Created automatically when a published slug changes; chains are collapsed. |
| `User` | Stores a bcrypt hash, a role (`admin` or `editor`) and a status (`active` or `disabled`). |

## Sections

`server/sections/index.js` is the single source of truth for section types: hero, about, skills, projects, experience, stats, cta, contact, textImage, testimonials and resume.

- Each type is a zod schema in which every field has a default.
- Unknown keys are stripped.
- URLs are restricted to `https:`, `http:`, `mailto:`, `tel:`, site paths and `#anchors`.
- Rich text is run through `sanitize-html` with a small allow-list.
- Each section also has a constrained `style` object (background, spacing, alignment, width and anchor).

There are three counterparts on the client:

| File | What it holds |
|---|---|
| `client/src/components/sections/*` | One React renderer per section type |
| `client/src/admin/editors/sectionFields.js` | The property-panel field definitions for each section type |
| `<Editable field="...">`, `CmsButton`, `CmsImage`, `RichText` | Wrappers that connect rendered elements to their field keys |

## Visual editor flow

1. `PageEditor` loads `GET /api/admin/pages/:id` and keeps the draft in React state.
2. The centre panel is an `<iframe src="/preview/:id?embed=1">` sized to the device width (1280, 768 or 390 px) and scaled to fit. It runs the real public renderers, so the preview matches the live site.
3. On every change, the editor sends `postMessage({type:'cms:update', page, selected})` to the iframe. This is restricted to the same origin.
4. In embedded mode, the iframe wraps sections and editable fields with click handlers. A click sends `cms:select` with `{sectionId, field}` back to the editor, which opens and highlights the matching control.
5. **Save draft** calls `PUT /api/admin/pages/:id/draft`. The server validates and normalises the draft and never touches `published`.
6. **Publish** calls `POST /api/admin/pages/:id/publish`. The server copies the draft into `published`, increments `version` and stores a `Revision`.
7. **Restore** loads a revision back into the draft. You review it, then publish it. **Discard** resets the draft to the published content.

## Security summary

- The session is a JWT in an HTTP-only, `SameSite=Lax` cookie (`Secure` in production). Nothing is stored in localStorage.
- **CSRF:** each session carries a random token inside the signed JWT. The SPA gets it from `/api/auth/me`, keeps it in memory, and sends it as `X-CSRF-Token`. Every non-GET admin request must include it.
- **Rate limits:** login allows 10 failed attempts per 15 minutes per IP; the contact form allows 5 messages per 15 minutes per IP; the whole API allows 600 requests per minute.
- **NoSQL injection:** `$`- and `.`-prefixed keys are stripped from request bodies and queries, zod validates every input, and Mongoose `sanitizeFilter` is enabled.
- **Headers:** helmet with a Content Security Policy, plus CORS restricted to `CLIENT_URL`.
- **Contact spam:** a honeypot field drops bot submissions without telling the bot.
- **Theme:** colours must be hex values and every other option comes from a fixed list, so there's no arbitrary CSS or JavaScript.
- Draft content is only reachable through authenticated admin endpoints.
