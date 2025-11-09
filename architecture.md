## Architecture plan

### Goals
- Keep authoring simple: blog/diary in Markdown; everything else structured.
- Fast reads and robust writes; minimal operational overhead.
- Cute Y2K aesthetic preserved; admin UX fits existing `Window`/`Button` components.

### High-level overview
- UI: Next.js App Router with Server Components where possible; Client Components for interactive widgets.
- Storage:
  - Markdown: blog + diary content with front‑matter metadata.
  - PostgreSQL: structured data (guestbook, scrapbook, homepage blocks, polls/quizzes/surveys, votes, settings).
  - S3: media uploads (images) via presigned URLs.
  - Umami: analytics tracking + stats API.
  - Optional Redis: cache hot queries; never source of truth.
- Auth: middleware-protected `/admin/**` using HTTP‑only session (JWT or NextAuth Credentials).
- Caching: ISR with on‑demand revalidation by tag/path after admin writes.

### Content responsibilities
- Blog + Diary
  - Source of truth: Markdown files (`content/blog/**`, `content/diary/**`) with front‑matter (title, slug, date, tags, summary, hero image).
  - Storage location:
    - Local/self-hosted: write `.md` with `fs/promises`.
    - Vercel/non-persistent FS: commit through GitHub Content API; keep history in Git.
  - Reading: server-side load, parse via `gray-matter`, cache with ISR.
- Scrapbook
  - Structured items: `image_url`, `caption`, `taken_at`, `album`, `tags` → Postgres.
  - Images stored in S3; inserted into items by URL.
- Homepage misc (profile blurb, status/mood, FAQ, favorites, to‑do, poll, quiz/survey)
  - Stored in Postgres. Read with ISR tags per section (`homepage`, `polls`, `faq`, etc.).
- Guestbook
  - Public write (no account) + captcha; Postgres storage with moderation flag.
  - Admin moderation in `/admin/guestbook`.
- Analytics
  - Umami script on index.
  - Stats pulled from Umami API and rendered in the Analytics window.

### Data model (PostgreSQL outline)
- posts_meta (optional if you want indexed listings)
  - id (uuid), slug (unique), title, summary, tags JSONB, published_at timestamptz, storage_key (md file path)
- diary_meta (optional, same idea as posts_meta)
- scrapbook_items
  - id (uuid), image_url, caption, taken_at date, album text, tags JSONB, created_at timestamptz
- guestbook_entries
  - id (uuid), name text, message text, email text NULL, created_at timestamptz, is_approved boolean, ip_hash text
- settings_kv
  - key text primary key, value JSONB (profile blurb, mood/status, favorites list, faq entries, to‑do list, homepage snippets)
- polls
  - id (uuid), question text, active_from timestamptz, active_to timestamptz
- poll_options
  - id (uuid), poll_id (fk), label text, sort int
- poll_votes
  - id (uuid), poll_id (fk), option_id (fk), voter_hash text, created_at timestamptz
- quizzes
  - id (uuid), question text, correct_option_id (fk -> quiz_options.id)
- quiz_options
  - id (uuid), quiz_id (fk), label text, sort int
- surveys
  - id (uuid), question text
- survey_options
  - id (uuid), survey_id (fk), label text, sort int
- survey_votes
  - id (uuid), survey_id (fk), option_id (fk), voter_hash text, created_at timestamptz
- analytics_events (only if you later add custom events; otherwise use Umami only)

ORM: Prisma or Drizzle. Prefer enum/constraints, add indexes on slugs, created_at, foreign keys.

### Media uploads (S3)
- Admin UI requests presigned upload from server: `POST /api/admin/upload` with `{ filename, contentType, folder }`.
- Server validates auth + type/size; responds `{ uploadUrl, fileUrl, key }`.
- Client uploads directly to S3 using `uploadUrl`.
- Editor inserts `![alt text](fileUrl)` into Markdown or stores `image_url` on scrapbook items.
- Key convention: `blog/{slug}/{uuid}-{safe-filename}` or `scrapbook/{album}/{uuid}-{safe-filename}`.
- Add image domain to `next.config.ts` `images.remotePatterns`.

### Admin authentication and protection
- `src/middleware.ts` protects `/admin(.*)` routes: checks HTTP‑only session cookie (JWT) or NextAuth session.
- Login flow: `/admin/login` form → `POST /api/admin/auth/login` → set cookie; logout clears it.
- Server validates admin role on every admin API route.

### API routes (route handlers)
- Auth
  - `POST /api/admin/auth/login` — credentials → session cookie (JWT). Rate-limit.
  - `POST /api/admin/auth/logout` — clear cookie.
- Uploads
  - `POST /api/admin/upload` — returns presigned S3 URL + final `fileUrl`.
- Blog/Diary (Markdown)
  - `POST /api/admin/posts` — create MD (fs or GitHub commit). Revalidate tags `blog` and relevant paths.
  - `PUT /api/admin/posts/:slug` — update MD.
  - `DELETE /api/admin/posts/:slug` — delete MD and related S3 images (optional cleanup).
  - Same set for diary.
- Scrapbook (Postgres)
  - `GET /api/scrapbook` — public list (paged, album filter).
  - `POST /api/admin/scrapbook` — create item.
  - `PUT /api/admin/scrapbook/:id`, `DELETE /api/admin/scrapbook/:id`.
- Guestbook (Postgres)
  - `GET /api/guestbook` — public list (paged, latest first, only approved).
  - `POST /api/guestbook` — public create (captcha required). Hash IP to `ip_hash` for abuse checks.
  - `PUT /api/admin/guestbook/:id` — approve/hide.
- Homepage settings (Postgres via `settings_kv`)
  - `GET /api/settings/:key` — public read for specific blocks or batched read by keys.
  - `PUT /api/admin/settings/:key` — update JSON; revalidate tags (`homepage`, etc.).
- Polls/Quizzes/Surveys (Postgres)
  - Polls: `GET /api/polls/active`, `POST /api/polls/vote` (with voter_hash), admin CRUD under `/api/admin/polls`.
  - Quizzes: read-only public, admin CRUD under `/api/admin/quizzes`.
  - Surveys: read `GET /api/surveys/active`, vote `POST /api/surveys/vote`, admin CRUD.
- Analytics (Umami)
  - Frontend: insert Umami script on index.
  - Server: optional `GET /api/analytics/summary` proxy to Umami for server-side rendering in the Analytics window.

### Rendering + caching strategy
- Use Server Components to load data where possible; Client Components for interactive widgets.
- ISR:
  - Export `revalidate = X` on pages where periodic refresh is okay.
  - Use `revalidateTag('blog'|'homepage'|'scrapbook'|'polls')` in admin routes post-write.
  - Use `revalidatePath('/some/path')` for specific pages if needed.
- Optional Redis cache for hot lists (e.g., latest posts) with short TTL; invalidate on writes.

### Admin UI
- `/admin` dashboard: quick links and recent changes.
- `/admin/posts`: list, create, edit (Markdown editor with drag‑drop image upload), delete.
- `/admin/diary`: same as posts.
- `/admin/scrapbook`: grid manager, add/edit items (S3 upload picker).
- `/admin/guestbook`: moderation queue (approve/hide), spam flags.
- `/admin/homepage`: edit profile blurb, status/mood, FAQ entries, favorites, to‑do.
- `/admin/polls`, `/admin/quizzes`, `/admin/surveys`: CRUD and results.

### Validation, rate-limiting, and security
- Validate request bodies with `zod`.
- Rate-limit public endpoints (`/api/guestbook`, vote endpoints) by IP (and `voter_hash`).
- Captcha: Cloudflare Turnstile (recommended) or hCaptcha on public forms.
- Sanitize slugs, enforce filename constraints, strip/validate image types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
- CSP and `X-Content-Type-Options: nosniff`; set proper CORS if any cross-origin admin calls (ideally none).
- Store secrets via environment variables; never expose AWS keys to client.

### Environments and secrets
- `DATABASE_URL` (Postgres), `NEXTAUTH_SECRET` (if using NextAuth), `ADMIN_EMAIL/ADMIN_PASS` (if using custom credentials), `AWS_*` (S3 access), `UMAMI_*` (if proxying server-side).
- On Vercel, set env vars for prod and preview.

### Dependencies
- Core: `gray-matter`, `zod`, `date-fns` (or `luxon`) for dates.
- ORM: `prisma` + `@prisma/client` (or `drizzle-orm`).
- Upload: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- Captcha: `@marsidev/react-turnstile` (or direct Turnstile script).
- Optional: `@upstash/redis` (cache), `slugify`.

### Deployment notes
- If file-system writes are not persistent (e.g., Vercel), use GitHub Content API for Markdown writes.
- Add S3/CloudFront domain to `next.config.ts` images `remotePatterns`.
- Ensure middleware works on edge or node runtime as chosen; admin API routes should run on node runtime for AWS SDK compatibility.

### Observability & backups
- Log admin writes (who/when/what) in a table or external log.
- Back up Postgres regularly (provider snapshots). S3 has lifecycle rules; consider Glacier for cold storage.
- If committing to GitHub for posts, Git history acts as content backup.

### Migration path / future-proofing
- Start with Markdown + Postgres split.
- If you later want MDX components in posts, keep front‑matter schema stable; render via MDX.
- If you need full-text search, add PG trigram or plug Algolia/Meilisearch.

### Example revalidation flow
1) Admin edits homepage favorites → `PUT /api/admin/settings/favorites`.
2) API validates + writes to Postgres.
3) API calls `revalidateTag('homepage')`.
4) Home renders updated section on next request.


