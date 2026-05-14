'use client';

import { useState, useEffect, useRef } from 'react';
import { search, SearchHit } from '@/lib/search';
import Link from 'next/link';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setHits(q.trim() ? search(q, 30) : []);
    }, 80);
    return () => clearTimeout(t);
  }, [q]);

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
      {q.trim() && (
        <p className="mt-2 text-xs text-ink-faint">
          {hits.length === 0 ? 'No matches' : `${hits.length} match${hits.length === 1 ? '' : 'es'}`}
        </p>
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
                  <span className="font-medium">{h.headword}</span>
                  <span className="text-xs text-ink-faint italic flex-shrink-0">{h.pos.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm text-ink-muted mt-0.5 line-clamp-1">{h.gloss}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
