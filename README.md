# Cleared

Cleared is a deal-to-cash workspace for creators and independent workers. It uses a monorepo layout:

- `frontend/` — Next.js App Router UI, Auth.js session handling, and a signed BFF proxy for Express API calls.
- `backend/` — Express 5 API organized into config, routes, controllers, services, middleware, and Prisma-backed models.

The app navigation is Today, Deals, Money, Docs, and Settings. Today collects open tasks, upcoming deliverables, invoices to send or follow up, and older unanswered pitches. Quick tasks can be linked to a deal; “Order my day” ranks them with AI or a deterministic urgency fallback.

The expansion features include:

- `/ai`: draft invoice/pitch/revision messages, summarize pasted contract text with verified source quotes, and ask read-only questions over the current user's records.
- Goals: monthly paid income, on-time deliverables and weekly pitches.
- Deal rooms: deliverables, deal-linked docs, focus sessions and effective hourly rates.
- Weekly review: earnings, slipped deliverables, goal progress and AI-suggested next priorities.
- Docs: Tiptap headings, bullets, checklists, links and deal/client mentions; templates, autosave, last-edited time, search, and user-reviewed AI drafts.

## Run locally

Install dependencies at the repository root with `npm install`. Copy `.env.example` to `backend/.env` for the Express API and database commands, and copy the frontend settings to `frontend/.env.local` for Next.js/Auth.js. Set `DATABASE_URL` to your Neon pooled connection string (the hostname includes `-pooler`) and `DIRECT_URL` to your Neon direct connection string before using database commands. Prisma uses the pooled URL for application connections and the direct URL for migrations. Run `npm run dev` for the web app on port 3000 and `npm run dev:backend` in a second terminal for the Express API on port 4000. The API health check is `GET /health`.

Set up the database with `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` from the root. The Prisma schema and initial migration include Auth.js models plus clients, deals, deliverables, invoices, tasks, goals, focus sessions, docs, AI usage, reminders and activities.

## Environment and integrations

`AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` must be set in `frontend/.env.local`; Next.js/Auth.js does not read `backend/.env`. In Google Cloud Console, create an OAuth 2.0 Web client and register `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI (plus the matching production callback URL when deployed). A Google `401 invalid_client` means the client ID is missing, incorrect, deleted, or not a valid OAuth client; confirm the ID and secret belong to that Web client. Google sign-in creates a user account on first use. `DATABASE_URL`, `DIRECT_URL`, and backend-only settings belong in `backend/.env`. The same `BACKEND_API_SECRET` must be available to Next.js and Express; the BFF signs each proxied request with the user ID, HTTP method, path, timestamp and body hash. Choose `AI_PROVIDER=gemini` or `AI_PROVIDER=anthropic` and configure the corresponding `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`; model IDs are independently configurable. `AI_DAILY_LIMIT` sets the per-user cap. Resend powers invoice email and weekly reviews via `RESEND_API_KEY` and `EMAIL_FROM`. `CRON_SECRET` protects scheduled routes. See `.env.example` for all settings.

The Express API owns the authenticated deals, invoices, clients, Today, goals, focus, review, docs and AI data endpoints. The Next.js routes for those endpoints are thin signed proxies. The AI API uses MVC separation: routers map endpoints to controllers, controllers validate requests and coordinate models/services, the provider service wraps the Claude and Gemini SDKs, and Prisma-backed model modules scope records and usage to the signed-in user. Auth.js and React-PDF rendering remain in the frontend; scheduled email jobs also run through the frontend routes for the configured Vercel cron schedule. `npm run build` compiles the backend and builds the frontend.

The workspace requires Google sign-in. Account data is scoped to the authenticated user. Public invoice links and token-protected scheduled jobs remain available without a session. Generated content is never sent or applied automatically. Cleared does not process payments or provide accounting or tax advice.

## Deploy

Deploy the frontend workspace to Vercel and the Express backend to a Node host. Set `BACKEND_API_URL` to the backend origin and configure the same `BACKEND_API_SECRET` in both services. Configure the database and provider/email environment variables in the services that use them. `vercel.json` schedules daily invoice reminders and the Monday weekly review; those routes require `Authorization: Bearer $CRON_SECRET`.
