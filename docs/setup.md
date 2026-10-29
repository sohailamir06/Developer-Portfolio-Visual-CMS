# Setup, configuration & deployment

## Requirements

- Node.js 20 or newer (developed on Node 22)
- MongoDB 6 or newer, either local or hosted (e.g. MongoDB Atlas)

## 1. Install

```bash
npm run install:all
```

## 2. MongoDB

**Local:** install MongoDB Community Server and make sure the service is running. The default connection string is:

```
MONGODB_URI=mongodb://127.0.0.1:27017/developer_portfolio
```

**Atlas:**

1. Create a cluster.
2. Add a database user.
3. Allow your server's IP address.
4. Use the SRV string: `MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/developer_portfolio`

If MongoDB can't be reached, the API exits at startup with a clear message. Content is stored in MongoDB, so it persists across restarts.

## 3. Environment variables (`server/.env`)

Copy `.env.example` to `server/.env`. The server validates these values at startup and refuses to boot if any are invalid.

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | | `development`, `production` or `test` |
| `PORT` | | API port. Defaults to `5050`, because 5000 is often taken by WSL or AirPlay. |
| `MONGODB_URI` | ✔ | MongoDB connection string |
| `MONGODB_TEST_URI` | | Database used by `npm test`. It is **dropped** on every run, and its name must contain "test". |
| `CLIENT_URL` | ✔ | Public site origin, used for the CORS allow-list, canonical URLs and the sitemap. Separate extra origins with commas. |
| `SESSION_SECRET` | ✔ | At least 32 random characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SESSION_TTL_HOURS` | | How long an admin session lasts (default 12) |
| `MEDIA_PROVIDER` | | `local` (default) or `cloudinary` |
| `MEDIA_MAX_FILE_MB` | | Upload size limit (default 5) |
| `MEDIA_LOCAL_DIR` | | Overrides the local upload folder (default `server/uploads`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | when cloudinary | Cloudinary credentials. They are used only on the server. |
| `CLOUDINARY_FOLDER` | | Cloudinary folder (default `portfolio`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | optional | Email notifications for new contact messages |
| `CONTACT_NOTIFY_TO`, `CONTACT_NOTIFY_FROM` | optional | Recipient and sender for those notifications |
| `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_CONTACT_MAX` | | Number of attempts allowed per IP in each 15-minute window (defaults 10 and 5) |
| `TRUST_PROXY` | | Set to `true` behind a reverse proxy, so rate limits and secure cookies see the real client IP |

Never commit `server/.env`; `.gitignore` already excludes it.

## 4. Create the first administrator

There is no public registration endpoint. Create accounts from the server:

```bash
npm run create-admin                              # prompts for email, name and password (hidden)
npm run create-admin -- --email me@example.com --name "Me"
npm run create-admin -- --email me@example.com --reset   # reset a forgotten password
```

For non-interactive environments (CI or containers), set the account details as environment variables instead:

```bash
ADMIN_EMAIL=me@example.com ADMIN_PASSWORD='a-long-password' npm run create-admin
```

Passwords must be at least 10 characters and are stored as bcrypt hashes. Once you're signed in, you can add more users (admins or editors) under **Admin → Users**.

## 5. Media storage

**Local (default):** files are written to `server/uploads/YYYY/MM/` and served from `/uploads/...`. This suits development and single-server hosting. Make sure that folder is on persistent storage and is backed up.

**Cloudinary:**

1. Create a Cloudinary account and copy the cloud name, API key and API secret from the dashboard.
2. Set the following in `server/.env`:
   ```
   MEDIA_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. Restart the API. Uploads are sent from the server as signed requests, so the secret never reaches the browser. Images are served through Cloudinary with automatic format, quality and width optimisation.
4. Upload a test image in **Admin → Media Library** and confirm the storage badge shows `cloudinary`.

> The Cloudinary code path is implemented but has **not** been verified against a live account in this environment, because no credentials were available. Test it with the steps above before relying on it.

**Validation for both providers:**

- Allowed formats are JPEG, PNG, GIF, WebP, AVIF and PDF (for résumés).
- The type is checked against the file's actual content, not just its extension.
- SVG is rejected because it can contain scripts.
- Files over the size limit are rejected with a 413 error.

A file that's still referenced by a page, project, skill or setting can't be deleted unless you confirm a force delete.

## 6. Email notifications (optional)

Set `SMTP_HOST` and `CONTACT_NOTIFY_TO` (plus credentials if your server needs them). Every contact message is saved to MongoDB whether or not email is configured. `GET /api/health` reports `emailEnabled`.

## 7. Development

```bash
npm run dev            # API on :5050 (auto-restarts on changes) + Vite on :5173
npm test               # server + client tests
npm run lint
```

Vite proxies `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to the API, so the browser sees a single origin and the session cookie works without extra CORS setup.

## 8. Production deployment

Single server: Express serves both the API and the built React app.

```bash
npm run install:all
npm run build                         # creates client/dist
NODE_ENV=production npm start         # serves the API and client/dist on PORT
```

In production:

- The cookie is `Secure`, so the site **must** be served over HTTPS (behind nginx, Caddy or a PaaS router). Set `TRUST_PROXY=true` behind a proxy.
- Set `CLIENT_URL` to the public origin, e.g. `https://janedoe.dev`.
- Requests for old URLs get real 301 responses from the redirect table.
- Each public page is served with its own `<title>`, description, canonical and Open Graph tags injected into the HTML, so crawlers and link previews get correct metadata without running JavaScript.
- `/admin` and `/preview` pages carry `noindex`, and `robots.txt` disallows them.
- Error responses never include stack traces.
- Run the process under a supervisor (systemd, PM2 or Docker) and keep `server/uploads` on persistent storage, or use Cloudinary.

Split hosting, with the frontend on a CDN: build the client and host `client/dist` with an SPA fallback to `index.html`. Proxy `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to the API under the same domain. The session cookie is `SameSite=Lax`, so a same-site setup is the simplest option.
