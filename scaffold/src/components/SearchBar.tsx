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

  // Snappy debounce for hit display — keeps the search results responsive.
  useEffect(() => {
    const t = setTimeout(() => {
      const query = q.trim();
      setDebouncedQ(query);
      setHits(query ? search(query, 30) : []);
    }, 80);
    return () => clearTimeout(t);
  }, [q]);

  const noMatches = debouncedQ.length > 0 && hits.length === 0;

  // Slower debounce (700ms) for the "no match" announcement — fires the
  // toast and opens the suggest modal once the user has settled on a query
  // that the corpus doesn't contain. Tracked via announcedQRef so we don't
  // re-announce or re-open for the same string.
  useEffect(() => {
    if (!noMatches) return;
    if (debouncedQ === announcedQRef.current) return;

    const t = setTimeout(() => {
      announcedQRef.current = debouncedQ;
      toast(`The word "${debouncedQ}" does not exist yet.`, {
        description: 'Please submit a suggestion to Cheison & Team for addition.',
        duration: 6000,
      });
      setModalPrefill(debouncedQ);
      setShowSuggest(true);
    }, 700);

    return () => clearTimeout(t);
  }, [noMatches, debouncedQ]);

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
