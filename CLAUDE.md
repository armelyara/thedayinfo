# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 blog application deployed on Firebase App Hosting. It features article management with draft/publish workflows, subscriber newsletter system, AI-powered content generation via Genkit, and a rich text editor using Tiptap.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (requires IS_BUILD=true env var)
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Genkit AI development (with auto-reload)
npm run genkit:dev
npm run genkit:watch
```

## Architecture

### Route Groups

The app uses Next.js route groups for logical separation:

- **(site)**: Public pages (home, about, contact, search, legal pages, unsubscribe)
- **(blog)**: Blog listing and article pages (`/blog/[slug]`)
- **(admin)**: Admin dashboard for article/draft management

### Data Layer

**Critical**: Never mix client and server data access patterns.

- `src/lib/data-client.ts`: Client-side Firestore queries (use Firebase SDK)
- `src/lib/data-admin.ts`: Server-side admin operations (use Firebase Admin SDK)
- `src/lib/data-types.ts`: Shared TypeScript types (Article, Draft, Subscriber, etc.)

### Authentication & Security

- Cookie-based session auth implemented in `src/lib/auth.ts`
- Middleware (`src/middleware.ts`) applies strict CSP headers to all routes
- CSP allows specific trusted domains for Firebase, Google APIs, CDNs, and unpkg.com
- Admin routes should verify authentication via `/api/auth-check`

### Newsletter System

- Service: `src/lib/newsletter-service.ts` uses Resend API
- Subscribers stored in Firestore with status (active/inactive/unsubscribed)
- Each subscriber has a unique `unsubscribeToken` for safe unsubscribe links
- Emails sent when articles are published or updated
- **Important**: Initialize Resend client at runtime, not module-level (prevents build errors)

### Rich Text Editor

- Component: `src/components/rich-text-editor.tsx`
- Uses Tiptap editor with extensive extensions (color, font, tables, images, links, etc.)
- Supports custom HTML embeds for interactive animations (iframe with srcdoc)
- Images compressed client-side before upload (`src/components/ui/image-upload.tsx`)
- Uploads to Firebase Storage, returns HTTPS URLs

### AI Integration (Genkit)

- Flows defined in `src/ai/flows/`
- Genkit config in `src/ai/genkit.ts`
- Uses Google AI plugin (`@genkit-ai/googleai`)
- Dev server: `npm run genkit:dev`

### Scheduled Publishing

- Cron endpoint: `/api/cron/publish-articles/route.ts`
- Publishes drafts with `status: 'scheduled'` when `scheduledFor` timestamp is reached
- Moves draft from `drafts` collection to `articles` collection
- Sends newsletter notification to active subscribers

## Critical Setup Requirements

### Firestore Indexes

**Required before first use**: Two composite indexes must be created manually.

1. **Articles index** (status + publicationDate):
   - Visit the URL in README.md under "Important: Firestore Indexing"
   - Click "Create" to build the index

2. **Drafts index** (status + scheduledFor):
   - Visit the second URL in README.md
   - Click "Create" to build the index

Without these indexes, queries will fail with `FAILED_PRECONDITION` errors.

### Environment Variables

**Server-side** (Firebase App Hosting provides automatically):
- `FIREBASE_WEBAPP_CONFIG`: JSON string with client Firebase config (parsed in next.config.js)
- `FIREBASE_SERVICE_ACCOUNT`: JSON string with service account credentials (used by Admin SDK)

**Required in production**:
- `RESEND_API_KEY`: API key for Resend email service
- `NEXT_PUBLIC_SITE_URL`: Full site URL (e.g., `https://thedayinfo.com`) for newsletter links

**Build flag**:
- `IS_BUILD=true`: Set during `npm run build` (see package.json script)

### Firebase Configuration

- Project ID and service account extracted from `FIREBASE_WEBAPP_CONFIG` at build time
- Client config injected as `NEXT_PUBLIC_*` vars in `next.config.js`
- Admin SDK initialized lazily on server to avoid build-time initialization

## Image Handling

- Images use `object-contain` in article cards and upload previews to show full image without cropping
- Compression: max 1200x1200px, 80% JPEG quality
- Size limit: 50MB before compression, 8MB after
- Storage: Firebase Storage with unique paths

## Key Technical Constraints

- **Standalone output**: Required for Firebase App Hosting (`output: 'standalone'` in next.config.js)
- **Server Actions body limit**: 50MB to handle large base64 image payloads during publish
- **Build-time safety**: TypeScript and ESLint errors ignored during build (`ignoreBuildErrors: true`) to unblock deployments
- **Node version**: 20 (specified in package.json engines)

## Rate Limiting

- Custom Firestore-based rate limiter: `src/lib/rate-limit-firestore.ts`
- Applied to comment posting and other sensitive endpoints
- Uses sliding window algorithm with TTL-based cleanup

## Common Patterns

### Adding a New API Route

```typescript
// src/app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Server-side only - can use Firebase Admin SDK here
  return NextResponse.json({ data: 'response' });
}
```

### Querying Articles Client-Side

```typescript
import { getAllArticles } from '@/lib/data-client';

// In a client component
const articles = await getAllArticles();
```

### Using Newsletter Service

```typescript
import { sendNewsletterNotification } from '@/lib/newsletter-service';

await sendNewsletterNotification(article, allSubscribers, isUpdate);
```

## Troubleshooting

- **Build fails with Resend error**: Ensure Resend is initialized at runtime, not at module level
- **Images not loading**: Check CSP headers in middleware allow the image domain
- **Firestore query fails**: Create the required composite indexes (see README.md)
- **Newsletter not sending**: Verify `RESEND_API_KEY` is set and valid
- **Port 8080 redirect loop**: Middleware strips `:8080` from Host header (Cloud Run artifact)
