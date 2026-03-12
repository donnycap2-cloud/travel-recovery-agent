# Trip PWA (Next.js 14)

Mobile-first starter using:

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Getting started

Install dependencies, then start the dev server:

```bash
npm install
npm run dev
```

## Supabase

1) Copy `.env.example` to `.env.local`

2) Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The Supabase client helper is in `lib/supabase.ts`.

## Routes

- `/` home screen
- `/add-trip` flight entry screen
- `/trip/[id]` monitoring screen
- `/plan/[id]` landing plan screen

## PWA readiness (not enabled yet)

The project includes an `app/manifest.ts` so the app can become installable once you add real icons.

To finish PWA setup later:

- Add `public/icons/icon-192.png` and `public/icons/icon-512.png`
- Add a service worker (e.g. via `next-pwa`) if you want offline caching

