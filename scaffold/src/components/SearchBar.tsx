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

  // Trigger the suggest flow on no EXACT headword match — not just zero hits.
  // The fuzzy search returns partial matches (e.g. "Serseren" -> serserik,
  // ko-sereran, sero ...) but none IS the user's query, so we should still
  // offer to suggest. Compare normalised lowercase headwords against the
  // normalised query, require >=3 chars to avoid firing on short exploratory
  // typing like "ke" or "ng".
  const queryNorm = debouncedQ.toLowerCase().trim();
  const hasExactMatch = hits.some(
    (h) => h.headword.toLowerCase().trim() === queryNorm
  );
  const shouldAnnounce = queryNorm.length >= 3 && !hasExactMatch;

  // 700ms settle, then toast + auto-open modal. announcedQRef prevents
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