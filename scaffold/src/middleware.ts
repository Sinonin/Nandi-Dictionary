import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Map of legacy entry IDs (typically OCR-era artefacts) to their canonical
 * post-correction IDs. Old URLs keep working via 301 redirect — useful so
 * that external links continue resolving and Supabase suggestions referencing
 * the old id can still be found by following the redirect.
 *
 * To add an alias when correcting another OCR'd entry_id:
 *   1. Add the line here
 *   2. Rename the entry_id in public/corpus.json
 *   3. UPDATE the corresponding rows in the Supabase suggestions table
 */
const ENTRY_ALIASES: Record<string, string> = {
  p274_surubelidt_n: 'p274_surubeliot_n',
};

export function middleware(req: NextRequest) {
  const m = req.nextUrl.pathname.match(/^\/entry\/(.+)$/);
  if (m) {
    const canonical = ENTRY_ALIASES[m[1]];
    if (canonical) {
      const url = req.nextUrl.clone();
      url.pathname = `/entry/${canonical}`;
      return NextResponse.redirect(url, 301);
    }
  }
}

export const config = {
  matcher: '/entry/:path*',
};