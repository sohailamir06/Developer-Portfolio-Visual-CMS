# Project: Full-Stack Developer Portfolio with a Visual CMS

## 1. Project Overview

Build a complete, modern, professional portfolio website for an IT Software Developer using the MERN stack.

The project must include two connected applications:

1. **Public Portfolio Website:** A professional portfolio that visitors can access.
2. **Admin Dashboard:** A secure content management system available at `/admin`, allowing the portfolio owner to manage and visually edit the website without writing code.

The portfolio owner must be able to update text, images, buttons, URLs, projects, skills, social links, contact information, and website sections through the admin dashboard.

The website should have a polished, modern design suitable for a professional software developer who works with frontend development, backend development, APIs, databases, and full-stack applications.

Do not create only a static portfolio or a dashboard mockup. Build a functional application with a real backend, database, authentication, content management, image uploads, and live website integration.

---

## 2. First: Inspect the Development Environment

Before writing code:

1. Inspect the current working directory.
2. Identify the existing framework, dependencies, project structure, and environment configuration.
3. If a project already exists, understand its implementation before modifying anything.
4. Preserve existing working functionality unless changes are necessary.
5. If the directory is empty, initialize the project with an appropriate MERN architecture.
6. Identify missing dependencies and install only what is required.
7. Explain the proposed architecture briefly, then begin implementation.

Do not stop after providing an implementation plan. Continue building the actual application.

Do not replace an existing project with a new scaffold without checking what is already there.

---

## 3. Required Technology Stack

Use the following technologies:

### Frontend
- React.js
- Vite
- React Router
- Tailwind CSS
- Lucide React icons
- Axios or an equivalent API client
- A suitable rich-text editor
- A suitable drag-and-drop library for section ordering

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Secure authentication
- Request validation
- Centralized error handling

### Media Management
- Cloudinary for image storage and optimization, or another configurable image-storage provider.
- Support local development with a documented storage configuration if cloud credentials are unavailable.

### Development Tools
- ESLint
- Environment variables
- Git-friendly project structure
- Appropriate testing tools

Use stable, compatible package versions.

Do not hardcode secrets, credentials, API keys, or production URLs in source code.

---

## 4. Website Routes

Implement the following routes.

### Public website

- `/` — Home
- `/about` — About Me
- `/projects` — All Projects
- `/projects/:slug` — Individual Project Details
- `/skills` — Skills and Technologies
- `/experience` — Work Experience
- `/contact` — Contact Page
- `/resume` — Resume Page or downloadable resume

The public navigation should be configurable through the admin dashboard.

If a section is disabled, hide it from the public navigation where appropriate.

Support configurable page slugs rather than hardcoding every internal URL.

### Admin dashboard

- `/admin/login` — Administrator Login
- `/admin` — Dashboard Overview
- `/admin/pages` — Page Management
- `/admin/pages/:id/edit` — Visual Page Editor
- `/admin/projects` — Project Management
- `/admin/skills` — Skills Management
- `/admin/experience` — Experience Management
- `/admin/media` — Media Library
- `/admin/navigation` — Navigation Editor
- `/admin/settings` — Website Settings
- `/admin/seo` — SEO Management
- `/admin/messages` — Contact Messages
- `/admin/users` — Administrator Management, if multiple accounts are supported

Protect all administrative routes and corresponding backend APIs.

Unauthenticated visitors must not be able to access protected admin functionality.

---

## 5. Public Portfolio Design

Create a visually impressive, responsive portfolio for an IT Software Developer.

The design should feel premium, modern, and professional rather than like a generic template.

Use a consistent design system with:
- Strong typography.
- Clear visual hierarchy.
- Consistent spacing.
- Attractive project cards.
- Subtle animations.
- Responsive layouts.
- Accessible color contrast.
- Consistent button and form styles.

A dark theme with a carefully balanced accent color is a suitable default. Make the primary accent color configurable.

Do not use excessive animations, distracting gradients, or unnecessary visual effects.

Avoid placeholder sections that do not have a working purpose.

### A. Header

Include:
- Developer logo or initials.
- Navigation links.
- Contact button.
- Optional theme toggle.
- Mobile navigation menu.

Every navigation label, destination URL, logo, and contact button must be editable in the admin dashboard.

### B. Hero Section

Create a compelling developer introduction with:
- Name.
- Professional title.
- Short introduction.
- Profile image.
- Primary call-to-action button.
- Secondary call-to-action button.
- GitHub link.
- LinkedIn link.
- Optional resume download.
- Optional availability indicator.

Example content:

Name: [Developer Name]

Title: Full-Stack Software Developer

Introduction: I build modern, scalable web applications and intuitive digital experiences using JavaScript, React, Node.js, and modern web technologies.

Primary button: View Projects

Secondary button: Contact Me

These are initial defaults only. Do not permanently hardcode this content into React components.

All hero content must come from the backend.

The administrator must be able to replace the profile image, edit the introduction, change button labels, and update button URLs.

### C. About Section

Include:
- About heading.
- Professional biography.
- Profile image.
- Key strengths.
- Years of experience, if provided.
- Optional statistics.
- Optional resume button.

Allow rich-text editing and image replacement.

Do not invent the developer's actual experience, education, achievements, or qualifications. Use editable initial content or clearly identified sample content.

### D. Skills Section

Display skills in organized categories, such as:

Frontend:
- HTML
- CSS
- JavaScript
- React
- Responsive Design

Backend:
- Node.js
- Express.js
- REST APIs

Database:
- MongoDB
- PostgreSQL

Tools:
- Git
- GitHub
- Docker
- Other configured tools

These are example defaults, not verified personal qualifications.

Each skill must support:
- Name.
- Icon or image.
- Category.
- Proficiency label or optional percentage.
- Display order.
- Visibility.

Allow the administrator to add, edit, reorder, categorize, and delete skills.

Do not force the use of proficiency percentages.

### E. Projects Section

Create a polished project gallery.

Each project should support:
- Project title.
- Unique slug.
- Short description.
- Full description.
- Featured image.
- Multiple gallery images.
- Technology stack.
- Live demo URL.
- Source code URL.
- Project category.
- Featured status.
- Display order.
- Publication status.
- SEO metadata.

Create project cards with attractive hover states and clear calls to action.

Provide an individual detail page for each published project.

Allow the administrator to create a new project without modifying application code.

If the live demo or source code URL is missing, hide the corresponding button.

### F. Experience Section

Support:
- Company name.
- Job title.
- Employment dates.
- Description.
- Responsibilities.
- Technologies used.
- Display order.
- Visibility.

Do not assume that the developer has particular employers or employment history.

### G. Contact Section

Include:
- Contact heading.
- Description.
- Email address.
- Optional phone number.
- Social media links.
- Contact form.
- Submission success and error messages.

Save contact form submissions to MongoDB.

Implement backend validation, spam protection, and appropriate rate limiting.

If email notifications are configured, send them securely through the backend.

Never expose SMTP credentials or email-provider API keys in the frontend.

### H. Footer

Include:
- Logo or developer name.
- Short introduction.
- Navigation links.
- Social links.
- Copyright text.
- Optional contact details.

All footer content must be editable.

---

## 6. The Most Important Feature: Visual Website Editing

Build a functional visual content management system.

The administrator must be able to manage the public website from `/admin` without editing source code.

Do not build a dashboard that only changes database records without showing how those changes affect the actual website.

### A. Visual Page Editor

Create a page editor with three areas:

LEFT SIDEBAR:
- Available sections.
- Existing page sections.
- Section visibility.
- Section ordering.
- Add section button.

CENTER:
- Website preview.
- Desktop preview.
- Tablet preview.
- Mobile preview.
- Selectable page elements where practical.

RIGHT SIDEBAR:
- Properties of the selected section or element.
- Text inputs.
- Rich-text editor where appropriate.
- Image selector.
- Button label and URL fields.
- Visibility settings.
- Styling options permitted for that section.

The interface should be intuitive for a nontechnical user.

### B. Editing Text

When an administrator selects a text section, allow editing:
- Heading.
- Subheading.
- Paragraphs.
- Labels.
- Captions.
- Button text.
- Link text.

Changes must be saved to the backend and reflected in the public website after publication.

### C. Editing Images

When an administrator selects an image, provide:
- Current image preview.
- Replace Image button.
- Media Library selector.
- Upload Image button.
- Alternative text field.
- Optional caption.
- Image positioning or display options supported by the component.

The administrator must be able to replace images without changing React code.

### D. Editing Buttons

For every editable button, support:
- Button text.
- Destination URL.
- Internal or external link.
- Open in new tab.
- Button style from predefined options.
- Visibility.

Validate URLs and reject unsafe protocols.

### E. Managing Sections

Allow the administrator to:
- Add a section from predefined templates.
- Edit section content.
- Duplicate a section.
- Hide or show a section.
- Delete a section after confirmation.
- Reorder sections using drag and drop.
- Preview the changes.
- Save drafts.
- Publish changes.

Use predefined section types rather than allowing arbitrary uncontrolled HTML.

Initial section types should include:
- Hero.
- About.
- Skills.
- Project Grid.
- Experience Timeline.
- Statistics.
- Call to Action.
- Contact.
- Custom Text and Image.
- Testimonials, if needed.

Each section must have a validated data schema and a corresponding React renderer.

### F. Visual Selection

Where practical, allow the administrator to select a component directly in the website preview.

When an element is selected:
1. Highlight the selected element.
2. Identify its section and editable fields.
3. Display the appropriate settings in the properties panel.
4. Allow the administrator to make changes.
5. Update the preview.
6. Save the changes as a draft.

Do not attempt to make every arbitrary DOM element editable automatically.

Instead, connect explicitly supported components to their corresponding content fields.

### G. Do Not Confuse the Preview with the Published Website

The editor must not modify the public website immediately whenever a field changes.

Implement explicit draft and publishing workflows.

---

## 7. Draft, Preview, and Publish System

Implement proper content versioning.

The administrator should have these actions:

- Save Draft.
- Preview.
- Publish.
- Discard Changes.
- Restore Previous Version, if supported.

Expected behavior:

1. The administrator edits a page.
2. Changes are saved to the draft.
3. The administrator previews the draft.
4. The administrator publishes the approved version.
5. Visitors see the newly published version.

Public API endpoints must return published content only.

Draft content must only be accessible to authorized administrators.

Implement revision history so the administrator can recover from accidental edits.

Avoid overwriting the published version when a draft is saved.

---

## 8. Backend and MongoDB Data Models

Create appropriate Mongoose models.

At minimum, implement:

### User
- Name.
- Email.
- Password hash.
- Role.
- Account status.
- Timestamps.

### Page
- Title.
- Slug.
- Page type.
- Draft content.
- Published content or a published-version reference.
- SEO metadata.
- Publication status.
- Revision information.
- Timestamps.

### Project
- Title.
- Slug.
- Description.
- Rich-text content.
- Images.
- Technologies.
- Demo URL.
- Repository URL.
- Featured status.
- Publication status.
- Display order.
- SEO metadata.

### Skill
- Name.
- Category.
- Icon.
- Optional proficiency.
- Display order.
- Visibility.

### Experience
- Company.
- Position.
- Dates.
- Description.
- Technologies.
- Display order.

### Media
- Original filename.
- Storage URL.
- Alternative text.
- MIME type.
- File size.
- Dimensions, where available.
- Upload timestamp.
- Optional usage references.

### Navigation
- Menu name.
- Menu items.
- Labels.
- URLs.
- Parent relationships for dropdowns.
- Display order.
- Visibility.

### WebsiteSettings
- Site title.
- Logo.
- Favicon.
- Theme settings.
- Global contact details.
- Social links.
- Header and footer configuration.
- SEO defaults.

### ContactMessage
- Name.
- Email.
- Subject.
- Message.
- Submission timestamp.
- Processing status.

### Revision
- Content type.
- Content identifier.
- Version number.
- Saved content snapshot.
- Author.
- Timestamp.

Adapt the schema when appropriate, but keep draft and published content isolated.

Do not create duplicate models for the same purpose.

Use Mongoose validation, appropriate indexes, and unique constraints.

---

## 9. REST API Requirements

Create clean, documented REST endpoints.

Examples:

Authentication:
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`

Public content:
- GET `/api/public/pages/:slug`
- GET `/api/public/projects`
- GET `/api/public/projects/:slug`
- GET `/api/public/skills`
- GET `/api/public/experience`
- GET `/api/public/navigation`
- GET `/api/public/settings`

Admin pages:
- GET `/api/admin/pages`
- POST `/api/admin/pages`
- GET `/api/admin/pages/:id`
- PUT `/api/admin/pages/:id/draft`
- POST `/api/admin/pages/:id/publish`
- GET `/api/admin/pages/:id/revisions`

Admin projects:
- GET `/api/admin/projects`
- POST `/api/admin/projects`
- PUT `/api/admin/projects/:id`
- DELETE `/api/admin/projects/:id`

Admin skills:
- GET `/api/admin/skills`
- POST `/api/admin/skills`
- PUT `/api/admin/skills/:id`
- DELETE `/api/admin/skills/:id`

Admin media:
- GET `/api/admin/media`
- POST `/api/admin/media`
- DELETE `/api/admin/media/:id`

Admin navigation:
- GET `/api/admin/navigation`
- PUT `/api/admin/navigation`

Admin settings:
- GET `/api/admin/settings`
- PUT `/api/admin/settings`

Contact:
- POST `/api/public/contact`
- GET `/api/admin/messages`
- PATCH `/api/admin/messages/:id`

These are proposed API contracts. Implement the required controllers, validation, services, authentication middleware, and error handling.

Ensure all administrator endpoints require authentication and appropriate authorization.

Never allow a public API request to retrieve unpublished content.

---

## 10. Authentication and Security

Implement a secure administrator login system.

Requirements:
- Hash passwords using a suitable password-hashing library.
- Use secure, HTTP-only authentication cookies where appropriate.
- Apply appropriate SameSite and Secure cookie settings.
- Protect against CSRF where required by the authentication design.
- Validate every incoming request.
- Restrict CORS to configured origins.
- Apply rate limiting to authentication and public form endpoints.
- Protect against NoSQL injection.
- Sanitize rich-text content.
- Validate image uploads and file sizes.
- Validate external links.
- Avoid exposing stack traces in production.
- Protect sensitive routes and data.
- Store secrets in environment variables.

Do not create a public endpoint that lets anyone register as an administrator.

Provide a secure way to create the initial administrator account.

For local development, document how to create the initial account using a command-line script or another protected setup procedure.

Do not hardcode a production administrator password.

Do not store authentication tokens or passwords in localStorage.

---

## 11. Image Upload and Media Library

Implement an image-management workflow.

Requirements:
- Upload images.
- Display image thumbnails.
- Search and select existing images.
- Replace images.
- Edit alternative text.
- Remove unused images safely.
- Support commonly used image formats.
- Validate file type and size.
- Provide loading and error states.

If Cloudinary is configured, use a secure server-side signing or upload workflow.

Store image URLs and relevant metadata in MongoDB, not image binaries by default.

Do not expose Cloudinary API secrets in React.

If cloud credentials are unavailable during development, make the upload provider configurable and clearly document the setup required to enable production uploads.

Do not silently simulate successful uploads.

---

## 12. Website Theme and Styling Controls

Allow the administrator to change selected global design settings:
- Primary color.
- Secondary color.
- Accent color.
- Background color.
- Typography presets.
- Button style.
- Border radius.
- Header layout.
- Footer layout.

Use predefined choices and sensible constraints.

Store theme settings in MongoDB and apply them through CSS variables.

For example:

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #0f172a;
  --color-accent: #38bdf8;
  --color-background: #ffffff;
}
```

These values are initial defaults only.

The public website should load its configured theme from the backend.

Avoid allowing arbitrary CSS or JavaScript injection through the admin dashboard.

Changing global styling should not break responsive layouts.

---

## 13. Responsive Design

Ensure both the public website and admin dashboard work on:
- Desktop.
- Laptop.
- Tablet.
- Mobile.

The public portfolio must look polished on all supported viewport sizes.

The visual editor should support desktop, tablet, and mobile preview modes.

Preview modes must accurately communicate the selected viewport size, even if they do not reproduce every device-specific behavior.

Do not allow the admin sidebar to make the editor unusable on smaller screens.

---

## 14. SEO and Performance

Implement:
- Editable page titles.
- Meta descriptions.
- Canonical URLs where appropriate.
- Social-sharing metadata.
- Image alternative text.
- Clean URLs.
- Sitemap generation.
- Robots configuration.
- Appropriate redirects when slugs change.
- Lazy loading for suitable images.
- Image optimization.
- Sensible API caching.
- Loading and error states.

Ensure each public project detail page has its own metadata.

Preserve the previous URL when possible.

If a page slug changes, provide a way to configure redirects rather than leaving broken links.

If search engine optimization is a priority, consider server-side rendering or prerendering for public pages rather than relying exclusively on client-side rendering.

Do not expose private admin pages or draft content to search engines.

---

## 15. Recommended Project Structure

Use a maintainable project structure similar to:

```text
developer-portfolio/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── sections/
│   │   │   └── forms/
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── Skills.jsx
│   │   │   └── Contact.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── editors/
│   │   │   └── hooks/
│   │   │
│   │   ├── services/
│   │   ├── context/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── validators/
│   ├── scripts/
│   ├── tests/
│   ├── app.js
│   └── server.js
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── setup.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Adjust this structure when necessary, but keep frontend, backend, data models, and administrative functionality organized.

---

## 16. Environment Configuration

Create a documented `.env.example`.

Include the required configuration variables, such as:

```env
NODE_ENV=development

PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/developer_portfolio

CLIENT_URL=http://localhost:5173

ADMIN_URL=http://localhost:5173/admin

SESSION_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Adapt these variables to the actual authentication, hosting, and media-storage implementation.

Never commit the real `.env` file.

Validate required environment variables when the backend starts.

Do not claim the cloud upload feature is operational unless the provider is configured and the upload has been tested.

---

## 17. Development and Startup Commands

Configure the project so that the frontend and backend can be started conveniently.

Prefer a root-level development command that starts both applications when practical.

Provide commands for:

- Installing dependencies.
- Starting the frontend.
- Starting the backend.
- Running both in development.
- Running tests.
- Creating the initial administrator.
- Building the production frontend.

Document any MongoDB or cloud-storage requirements.

Do not assume that a MongoDB database or cloud service is available without verifying the configuration.

---

## 18. Testing Requirements

Implement meaningful tests for the core functionality.

At minimum, verify:

### Authentication
- Valid administrator login works.
- Invalid login is rejected.
- Protected APIs reject unauthenticated requests.

### Content Management
- An administrator can create a page.
- An administrator can save a draft.
- Draft content does not replace published content.
- An administrator can publish changes.
- Public APIs return published content only.
- An administrator can update project information.

### Media
- Valid image uploads work when the provider is configured.
- Invalid file types are rejected.
- Unauthorized upload attempts are rejected.

### Website Rendering
- Homepage content comes from the API.
- Project listings display published projects.
- Hidden sections do not appear publicly.
- Invalid or missing content does not crash the page.

### Contact
- Valid messages are saved.
- Invalid submissions are rejected.
- Rate limits are enforced.

Run the tests and fix failures.

Do not report tests as passing unless they have actually been executed successfully.

---

## 19. Implementation Order

Implement the application in the following order.

### Phase 1: Foundation
- Inspect the repository.
- Configure React, Vite, Express, and MongoDB.
- Set up environment variables.
- Create the project structure.
- Verify frontend-to-backend communication.

### Phase 2: Public Portfolio
- Build the responsive layout.
- Implement all public pages.
- Create reusable website sections.
- Load content from the backend.
- Implement project detail pages.

### Phase 3: Authentication
- Implement administrator login.
- Secure the admin routes.
- Protect administrative APIs.
- Add the initial administrator setup script.

### Phase 4: Content Management
- Create MongoDB models.
- Build the admin dashboard.
- Implement page and project management.
- Implement skills and experience management.
- Implement navigation and global settings.

### Phase 5: Media and Visual Editor
- Build the Media Library.
- Implement image replacement.
- Build the section-based visual editor.
- Add section creation, duplication, deletion, and ordering.
- Connect editable fields to the public website components.

### Phase 6: Publishing
- Implement draft and published content.
- Build preview functionality.
- Add revision history.
- Ensure public visitors see published content only.

### Phase 7: Final Features
- Add SEO controls.
- Add contact-message management.
- Add theme settings.
- Improve accessibility and performance.

### Phase 8: Verification
- Run tests.
- Test all major workflows manually.
- Fix errors.
- Verify responsive layouts.
- Document installation and deployment.

Work incrementally. After completing each phase, verify the implementation before proceeding.

---

## 20. Acceptance Criteria

The project is not complete until all the following conditions are met.

1. The public portfolio works at `/`.
2. The administrator can log in through `/admin/login`.
3. The admin dashboard works at `/admin`.
4. The administrator can edit homepage headings and paragraphs.
5. The administrator can upload and replace images.
6. The administrator can change button labels and URLs.
7. The administrator can create, edit, reorder, and hide sections.
8. The administrator can add, edit, and delete projects.
9. The administrator can manage skills and experience.
10. The administrator can update navigation links.
11. The administrator can update the website logo and footer content.
12. The administrator can save drafts without changing the public website.
13. The administrator can preview unpublished changes.
14. Publishing updates the public website.
15. Previous published content can be recovered through revision history.
16. Public visitors cannot access drafts or protected admin APIs.
17. The website works on desktop, tablet, and mobile.
18. Content persists in MongoDB across application restarts.
19. Image uploads work when the configured storage provider is available.
20. The application has clear setup documentation.
21. Core functionality is tested and verified.
22. No major feature is represented by a nonfunctional placeholder.

If a feature depends on missing external credentials, document the requirement and implement the integration so it can be configured later.

Do not claim the feature is operational until it has been verified.

---

## 21. Final Instructions to Claude

Act as a senior MERN stack engineer and implement the actual project.

Follow these rules:

- Do not stop after generating a plan.
- Do not deliver only static frontend pages.
- Do not create a dashboard that merely looks functional.
- Do not hardcode editable website content in React components.
- Do not store real passwords or secrets in source code.
- Do not bypass authentication to simplify development.
- Do not expose drafts through public APIs.
- Do not silently ignore missing dependencies or configuration.
- Do not delete existing project functionality without a clear reason.
- Do not introduce unnecessary complexity before the core system works.
- Reuse components and follow consistent coding standards.
- Handle loading, empty, success, and error states.
- Keep the website design professional and responsive.
- Verify API integration and database persistence.
- Run available tests and fix errors.
- Document setup, administrator creation, media configuration, and deployment.

If you encounter an implementation decision that does not materially affect the architecture, choose a sensible default and continue.

If an essential external service is unavailable, implement a clearly documented configuration path rather than pretending the integration works.

At completion, provide:
1. A summary of implemented features.
2. The final project structure.
3. Installation and startup commands.
4. MongoDB setup instructions.
5. Instructions for creating the initial administrator.
6. The URL for the public portfolio.
7. The URL for the admin dashboard.
8. A list of required environment variables.
9. Test results.
10. Any remaining limitations.

**The ultimate goal is a fully working developer portfolio and a secure visual CMS that allows a nontechnical owner to manage the website without modifying source code.**