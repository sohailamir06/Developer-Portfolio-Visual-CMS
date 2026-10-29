# Developer Portfolio + Visual CMS (MERN)

A professional portfolio website for a software developer, with a secure admin dashboard at `/admin` for editing the whole site visually, without touching code.

- **Public site:** React, Vite, Tailwind. Every text, image, button, link, section, menu, colour and logo comes from MongoDB.
- **Visual editor:** section list with drag-and-drop on the left, a live preview at desktop, tablet or mobile width in the centre, and a properties panel on the right. Click any highlighted element in the preview to edit it.
- **Drafts and publishing:** saving a draft never changes the live site. You can preview the draft, then publish it. Every publish is kept in revision history and can be restored.
- **Backend:** Express 5 and Mongoose 8, with zod validation, HTTP-only cookie sessions, CSRF protection, rate limiting and sanitised rich text.
- **Media library:** uploads go to local disk by default, or to Cloudinary when it's configured.

## Quick start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure the API (needs a running MongoDB)
cp .env.example server/.env        # then set SESSION_SECRET (see the file for a generator)

# 3. Optional: load clearly-labelled sample skills/projects
npm run seed

# 4. Create the first administrator (there is no public sign-up)
npm run create-admin

# 5. Run API + web together
npm run dev
```

- Public portfolio: http://localhost:5173
- Admin dashboard: http://localhost:5173/admin
- API: http://localhost:5050/api (proxied through Vite in development)

The default pages, navigation and settings are created automatically the first time the API starts.

## Commands

| Command | What it does |
|---|---|
| `npm run install:all` | Installs root, server and client dependencies |
| `npm run dev` | Starts the API (port 5050, auto-restarts on code changes) and Vite (port 5173) |
| `npm run dev:server` / `npm run dev:client` | Starts one side only |
| `npm test` | Runs the server tests (Vitest + Supertest against `developer_portfolio_test`), then the client tests (Vitest + Testing Library) |
| `npm run lint` | Runs ESLint on both apps |
| `npm run create-admin` | Creates or resets an administrator account (interactive, or via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars) |
| `npm run seed` | Adds sample content to empty collections only |
| `npm run build` | Builds the production frontend into `client/dist` |
| `npm start` | Starts the API in whatever mode `NODE_ENV` says. With `NODE_ENV=production` it also serves `client/dist` with per-page SEO tags |

## Documentation

- [docs/setup.md](docs/setup.md): installation, MongoDB, admin creation, media and email configuration, deployment
- [docs/architecture.md](docs/architecture.md): how the pieces fit together
- [docs/api.md](docs/api.md): REST endpoints
- [docs/inspection-report.md](docs/inspection-report.md): the initial environment report
