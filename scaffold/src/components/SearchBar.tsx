'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { search, SearchHit } from '@/lib/search';
import SuggestNewEntryModal from './SuggestNewEntryModal';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [modalPrefill, setModalPrefill] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const announcedQRef = useRef('');

  // Snappy debounce for hit display.
  useEffect(() => {
    const t = setTimeout(() => {
      const query = q.trim();
      setDebouncedQ(query);
      setHits(query ? search(query, 30) : []);
    }, 80);
    return () => clearTimeout(t);
  }, [q]);

  // Three-stage check for whether to invite a new-entry suggestion:
  //   1. Length >= 3 — avoid firing on tiny exploratory typing ("ke", "ng")
  //   2. No EXACT headword match — "kerundut" already exists, don't ask
  //   3. Query is not a PREFIX of any hit — "Surumb" -> "surumbet" is
  //      autocomplete-style exploration, not a suggestion moment
  // Fires only when the user has typed something that genuinely isn't in
  // the corpus AND isn't a typed-so-far prefix of something that is.
  const queryNorm = debouncedQ.toLowerCase().trim();
  const hasExactMatch = hits.some(
    (h) => h.headword.toLowerCase().trim() === queryNorm
  );
  const queryIsPrefixOfHit = hits.some((h) => {
    const hw = h.headword.toLowerCase().trim();
    return hw.startsWith(queryNorm) && hw.length > queryNorm.length;
  });
  const shouldAnnounce =
    queryNorm.length >= 3 && !hasExactMatch && !queryIsPrefixOfHit;

  // 700ms settle, then toast + auto-open modal. announcedQRef stops
  // re-firing for the same string on every render.
  useEffect(() => {
    if (!shouldAnnounce) return;
    if (debouncedQ === announcedQRef.current) return;

    const t = setTimeout(() => {
      announcedQRef.current = debouncedQ;
      toast(`The word "${debouncedQ}" is not in the dictionary yet.`, {
        description: 'Please submit a suggestion to Cheison & Team for addition.',
        duration: 6000,
      });
      setModalPrefill(debouncedQ);
      setShowSuggest(true);
    }, 700);

    return () => clearTimeout(t);
  }, [shouldAnnounce, debouncedQ]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Nandi or English…"
        className="w-full px-4 py-3 text-base border border-ink/15 rounded-lg bg-paper-card focus:border-accent transition-colors"
        aria-label="Dictionary search"
      />

      {hits.length > 0 && (
        <>
          <p className="mt-2 text-xs text-ink-faint">
            {hits.length} match{hits.length === 1 ? '' : 'es'}
          </p>
          <ul className="mt-3 divide-y divide-ink/10 border border-ink/10 rounded-lg bg-paper-card overflow-hidden">
            {hits.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/entry/${h.id}`}
                  className="block px-4 py-3 hover:bg-paper transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{h.headword}</span>
                    <span className="text-xs text-ink-faint italic flex-shrink-0">
                      {h.pos.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted mt-0.5 line-clamp-1">{h.gloss}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {showSuggest && (
        <SuggestNewEntryModal
          initialQuery={modalPrefill}
          onClose={() => setShowSuggest(false)}
        />
      )}
    </div>
  );
}