import corpusJson from '../../public/corpus.json';
import audioManifestJson from '../../public/audio-manifest.json';

export interface Example {
  nandi?: string;
  english?: string;
  raw?: string;
  phonetic: string;
}

export interface AudioRefs {
  primary: string | null;
  variants: string[];
}

export interface Entry {
  id: string;
  page: number;
  headword: string;
  pos: string;
  pos_raw: string;
  phonetic_forms: string[];
  gloss: string;
  etymology?: string;
  examples: Example[];
  review_flags: string[];
  section_hdr?: string | null;
  audio_url?: string;      // back-compat: equals audio.primary
  audio?: AudioRefs;
}

const audioMap = audioManifestJson as Record<string, AudioRefs>;

const seenIds = new Map<string, number>();
export const entries: Entry[] = (corpusJson as Entry[]).map((e) => {
  const a = audioMap[e.id];
  // Disambiguate homographs (same headword + POS + page) by suffixing _2, _3…
  const count = (seenIds.get(e.id) || 0) + 1;
  seenIds.set(e.id, count);
  const id = count === 1 ? e.id : `${e.id}_${count}`;
  return {
    ...e,
    id,
    audio: a,
    audio_url: a?.primary || undefined,
  };
});

export const byId = new Map(entries.map((e) => [e.id, e]));

// Useful precomputed groupings
export const byLetter: Record<string, Entry[]> = {};
for (const e of entries) {
  const l = e.headword.replace(/^-/, '').charAt(0).toLowerCase();
  (byLetter[l] ||= []).push(e);
}
