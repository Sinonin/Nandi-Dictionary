import MiniSearch from 'minisearch';
import { entries, Entry } from './corpus';
import { normalize } from './normalize';

let _index: MiniSearch<Entry> | null = null;

function getIndex(): MiniSearch<Entry> {
  if (_index) return _index;

  const ms = new MiniSearch<Entry>({
    fields: ['headword_norm', 'gloss', 'examples_text'],
    storeFields: ['id', 'headword', 'pos', 'gloss', 'phonetic_forms', 'audio_url'],
    extractField: (doc, field) => {
      if (!doc) return '';
      if (field === 'headword_norm') return normalize(doc.headword || '');
      if (field === 'examples_text') {
        const exs = doc.examples || [];
        return exs
          .map((ex) => [ex.nandi, ex.english, ex.raw].filter(Boolean).join(' '))
          .join(' ');
      }
      return (doc as unknown as Record<string, unknown>)[field] as string || '';
    },
    searchOptions: {
      boost: { headword_norm: 4, gloss: 1, examples_text: 0.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  // Defensive dedup — silently drop any entry whose id was already seen.
  const seen = new Set<string>();
  const unique: Entry[] = [];
  for (const e of entries) {
    if (!e.id || seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }

  // Add one at a time so a single bad doc tells us which one.
  for (let i = 0; i < unique.length; i++) {
    try {
      ms.add(unique[i]);
    } catch (err) {
      console.error(`[search.ts] Failed to index entry ${i} (${unique[i].id}):`, err);
      console.error('Document:', unique[i]);
    }
  }

  _index = ms;
  return ms;
}

export interface SearchHit {
  id: string;
  headword: string;
  pos: string;
  gloss: string;
  phonetic_forms: string[];
  audio_url?: string;
  score: number;
}

export function search(q: string, limit = 50): SearchHit[] {
  const nq = normalize(q);
  if (!nq) return [];
  const results = getIndex().search(nq, { fuzzy: 0.2, prefix: true });
  return results.slice(0, limit).map((r) => ({
    id: r.id as string,
    headword: r.headword as string,
    pos: r.pos as string,
    gloss: r.gloss as string,
    phonetic_forms: (r.phonetic_forms as string[]) || [],
    audio_url: r.audio_url as string | undefined,
    score: r.score,
  }));
}