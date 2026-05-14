# Nandi Dictionary — closed beta

A PWA dictionary built on the v1 corpus (Creider & Creider, 2001, pages 27–326), with 2,356 entries, tone-insensitive fuzzy search, an entry-card UI, and a suggest-correction loop wired to Supabase.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + site URL
npm run dev                        # http://localhost:3000
```

Without Supabase credentials the suggest API runs in dry-run mode (logs to server console, returns ok). Everything else works offline of any backend.

## Project layout

```
public/
  corpus.json              # the 2,356 dictionary entries
  audio-manifest.json      # entry_id → audio file URL (auto-generated)
  audio/                   # drop .m4a / .mp3 files here, named <entry_id>.<ext>
  manifest.json            # PWA manifest
src/
  app/
    layout.tsx             # site shell, header, footer with Nandi taglines
    page.tsx               # home — search + word-of-the-day + browse by letter
    entry/[id]/page.tsx    # entry detail page (static-generated)
    browse/[letter]/page.tsx
    api/suggest/route.ts   # POST suggestion → Supabase
  components/
    SearchBar.tsx
    EntryCard.tsx
    SuggestCorrectionModal.tsx
  lib/
    corpus.ts              # typed entry loader, merges audio-manifest
    normalize.ts           # tone/ATR-insensitive normalisation
    search.ts              # MiniSearch index
    supabase.ts            # server client (optional)
scripts/
  build-audio-manifest.mjs # runs before `next build`
```

## Adding audio

You record on your phone and name files however you want — `ke.m4a`, `nandi_001_ke.m4a`, `Recording_lakwet.m4a`, `bek alt.m4a`, all work. Drop them in a folder, then:

```bash
npm run ingest:audio /path/to/your/recordings
npm run build:audio-manifest
```

The ingest script reads `audio_priority_list.csv` at the project root to disambiguate words like "ke" (which appears in many compounds), maps each file to the right entry ID, and renames into `public/audio/`. Repeat recordings of the same word become `<id>__v2.m4a`, `<id>__v3.m4a`, etc., and the entry card cycles through them on successive taps of ▶ Play (the badge reads "1/3", "2/3", "3/3"…). Files that can't be matched are listed at the end of the run for you to rename and re-run.

The ingest script's audit trail lives at `public/audio/_ingest_report.json`.

### Pulling from Google Drive

If the recordings live in Drive, the easiest one-liner:

```bash
pip install gdown
gdown --folder 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID' -O ./recordings
npm run ingest:audio ./recordings
```

Or just use the "Download all" button in the Drive web UI, unzip, and point the script at the resulting folder.

Find an entry's ID by looking at the URL (`/entry/p027_abusanet_n`) or the bottom of the entry card.

## Supabase setup (when you're ready)

Create a project, then run this SQL in the SQL editor:

```sql
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  entry_id text not null,
  type text not null check (type in ('diacritic','gloss','example','ocr','new_sense','other')),
  current_value text,
  proposed_value text not null,
  reporter_name text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','applied')),
  created_at timestamptz not null default now()
);

-- Allow anonymous inserts; reads are only via the dashboard / service key
alter table public.suggestions enable row level security;
create policy "anyone can insert suggestions"
  on public.suggestions for insert
  to anon
  with check (true);
```

Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API into `.env.local`.

For moderation, work directly in the Supabase Table Editor (filter `status = 'pending'`), or build a small admin page later.

## Deploy

```bash
vercel deploy --prod
# Add env vars NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# NEXT_PUBLIC_SITE_URL via `vercel env add`
```

Custom domain (e.g. `nandi.cheison.com`): Vercel Project → Settings → Domains.

## Updating the corpus

The corpus is `public/corpus.json`. Re-running the Python parser regenerates it; drop the new file in and `npm run build`. Entry IDs are stable across rebuilds as long as headword + page + POS don't change, so audio files keep working.

## What's intentionally not here

- **No service worker / offline cache yet.** Added when the corpus stabilises.
- **No icons.** `icon-192.png` and `icon-512.png` need to be supplied (transparent-bg simple wordmark, see manifest.json reference).
- **No auth.** Closed beta = trust the URL.
- **No admin page.** Use Supabase Table Editor for the review queue until volume justifies one.
