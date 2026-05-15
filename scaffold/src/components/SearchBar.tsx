'use client';

import { useState, useEffect, useRef } from 'react';
import { search, SearchHit } from '@/lib/search';
import Link from 'next/link';
import SuggestNewEntryModal from './SuggestNewEntryModal';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [showSuggestNew, setShowSuggestNew] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setHits(q.trim() ? search(q, 30) : []);
    }, 80);
    return () => clearTimeout(t);
  }, [q]);

  const noResults = q.trim() !== '' && hits.length === 0;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Nandi or English..."
        className="w-full px-4 py-3 text-[19px] border border-ink/15 rounded-lg bg-paper-card focus:border-accent transition-colors"
        aria-label="Dictionary search"
      />

      {/* Always-visible "Propose a new entry" link, hidden only during no-results state which has its own bigger card */}
      {!noResults && (
        <p className="mt-2 text-[15px] text-ink-muted">
          Can&apos;t find a word?{' '}
          <button
            onClick={() => setShowSuggestNew(true)}
            className="text-accent font-medium underline underline-offset-2 hover:opacity-80"
          >
            Propose a new entry &rarr;
          </button>
        </p>
      )}

      {hits.length > 0 && (
        <p className="mt-1 text-[14px] text-ink-faint">
          {hits.length} match{hits.length === 1 ? '' : 'es'}
        </p>
      )}

      {noResults && (
        <div className="mt-3 p-5 border-2 border-accent/30 rounded-lg bg-paper-card">
          <p className="text-[17px] font-medium text-ink mb-2">
            &ldquo;{q.trim()}&rdquo; is not yet in the dictionary.
          </p>
          <p className="text-[15px] text-ink-muted mb-4 leading-relaxed">
            This may be a gap in the record. If you know this word in Nandi, propose it as a new entry. Every accepted contribution becomes part of the permanent dictionary.
          </p>
          <button
            onClick={() => setShowSuggestNew(true)}
            className="px-4 py-2.5 text-[16px] font-medium bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Propose &ldquo;{q.trim()}&rdquo; as a new entry &rarr;
          </button>
        </div>
      )}

      {hits.length > 0 && (
        <ul className="mt-3 divide-y divide-ink/10 border border-ink/10 rounded-lg bg-paper-card overflow-hidden">
          {hits.map((h) => (
            <li key={h.id}>
              <Link
                href={`/entry/${h.id}`}
                className="block px-4 py-3 hover:bg-paper transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[18px] font-medium">{h.headword}</span>
                  <span className="text-[13px] text-ink-faint italic flex-shrink-0">{h.pos.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-[15px] text-ink-muted mt-0.5 line-clamp-1">{h.gloss}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showSuggestNew && (
        <SuggestNewEntryModal
          query={q.trim()}
          onClose={() => setShowSuggestNew(false)}
        />
      )}
    </div>
  );
}
