'use client';

import { useState, useEffect, useRef } from 'react';
import { search, SearchHit } from '@/lib/search';
import Link from 'next/link';
import SuggestNewEntryModal from './SuggestNewEntryModal';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const query = q.trim();
      setDebouncedQ(query);
      setHits(query ? search(q, 30) : []);
    }, 80);
    return () => clearTimeout(t);
  }, [q]);

  const noMatches = debouncedQ.length > 0 && hits.length === 0;

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

      {noMatches && (
        <div
          role="alert"
          className="mt-3 bg-accent/5 border border-accent/30 rounded-lg p-4"
        >
          <p className="text-sm mb-3">
            The word <strong className="font-mono">&ldquo;{debouncedQ}&rdquo;</strong> isn&rsquo;t
            in the dictionary yet.
          </p>
          <button
            type="button"
            onClick={() => setShowSuggest(true)}
            className="text-sm px-3 py-2 bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Submit a suggestion to Cheison &amp; Team →
          </button>
        </div>
      )}

      {showSuggest && (
        <SuggestNewEntryModal
          initialQuery={debouncedQ}
          onClose={() => setShowSuggest(false)}
        />
      )}
    </div>
  );
}
