import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { byId } from '@/lib/corpus';

export const runtime = 'nodejs';

interface SuggestionBody {
  entry_id: string;
  type: string;
  current_value?: string;
  proposed_value: string;
  reporter_name?: string;
}

const ALLOWED_TYPES = new Set([
  'diacritic', 'gloss', 'example', 'ocr', 'new_sense', 'new_entry', 'other',
]);

export async function POST(req: NextRequest) {
  let body: SuggestionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(body.type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Entry-id validation differs by type:
  //  - new_entry: synthetic id like 'new_<slug>' (entry doesn't exist yet)
  //  - everything else: must reference an existing entry
  if (body.type === 'new_entry') {
    if (!body.entry_id || !body.entry_id.startsWith('new_')) {
      return NextResponse.json(
        { error: 'new_entry suggestions require entry_id starting with new_' },
        { status: 400 }
      );
    }
  } else {
    if (!body.entry_id || !byId.has(body.entry_id)) {
      return NextResponse.json({ error: 'Unknown entry_id' }, { status: 400 });
    }
  }

  const proposed = (body.proposed_value || '').trim();
  if (proposed.length < 1 || proposed.length > 2000) {
    return NextResponse.json({ error: 'Proposal length out of range' }, { status: 400 });
  }

  if (!supabase) {
    console.log('[suggest:dry-run]', body);
    return NextResponse.json({ ok: true, dry_run: true });
  }

  const { error } = await supabase.from('suggestions').insert({
    entry_id: body.entry_id,
    type: body.type,
    current_value: body.current_value ?? null,
    proposed_value: proposed,
    reporter_name: body.reporter_name ?? null,
    status: 'pending',
  });

  if (error) {
    console.error('[suggest:supabase]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
