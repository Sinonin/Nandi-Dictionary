'use client';

import { Entry } from '@/lib/corpus';
import { useState, useRef } from 'react';
import SuggestCorrectionModal from './SuggestCorrectionModal';

export default function EntryCard({ entry }: { entry: Entry }) {
  const [showSuggest, setShowSuggest] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const allTakes = entry.audio
    ? [entry.audio.primary, ...entry.audio.variants].filter(Boolean) as string[]
    : [];
  const [takeIdx, setTakeIdx] = useState(0);

  function playAudio() {
    if (allTakes.length === 0) return;
    // Cycle to next take on each successive tap
    setTakeIdx((i) => (i + 1) % allTakes.length);
    // Small timeout to let the src swap render
    setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
  }

  return (
    <article className="bg-paper-card border border-ink/10 rounded-xl p-5 sm:p-6">
      <header className="flex items-baseline justify-between gap-3 mb-1">
        <h1 className="text-2xl font-medium">{entry.headword}</h1>
        <span className="text-xs text-ink-faint font-mono">p.{entry.page}</span>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
        <span className="text-sm italic text-ink-muted">{entry.pos.replace(/_/g, ' ')}</span>
        {entry.phonetic_forms.length > 0 && (
          <span className="text-sm text-ink-faint font-mono">
            {entry.phonetic_forms.map((p) => `/${p}/`).join('  ·  ')}
          </span>
        )}
        {allTakes.length > 0 ? (
          <button
            onClick={playAudio}
            className="ml-auto px-2.5 py-1 text-xs border border-ink/15 rounded-md hover:bg-paper transition-colors"
            aria-label="Play pronunciation"
          >
            ▶ Play
            {allTakes.length > 1 && (
              <span className="ml-1 text-ink-faint">
                {takeIdx + 1}/{allTakes.length}
              </span>
            )}
          </button>
        ) : (
          <span className="ml-auto px-2.5 py-1 text-xs text-ink-faint border border-dashed border-ink/15 rounded-md">
            Audio pending
          </span>
        )}
        {allTakes.length > 0 && (
          <audio
            ref={audioRef}
            src={allTakes[takeIdx]}
            preload="none"
            key={allTakes[takeIdx]}
          />
        )}
      </div>

      <p className="text-base leading-relaxed mb-1">{entry.gloss}.</p>

      {entry.etymology && (
        <p className="text-xs text-ink-faint mb-4">
          <span className="italic">etym.</span> {entry.etymology}
        </p>
      )}

      {entry.examples.length > 0 && (
        <section className="border-t border-ink/10 pt-4 mt-4">
          <h2 className="text-xs uppercase tracking-wide text-ink-faint mb-3">Examples</h2>
          <ul className="space-y-3">
            {entry.examples.map((ex, i) => (
              <li key={i}>
                {ex.nandi && ex.english ? (
                  <>
                    <p className="text-base"><strong className="font-medium">{ex.nandi}</strong></p>
                    <p className="text-sm text-ink-muted">{ex.english}</p>
                  </>
                ) : (
                  <p className="text-sm">{ex.raw}</p>
                )}
                <p className="text-xs text-ink-faint font-mono mt-0.5">/{ex.phonetic}/</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-ink/10">
        <button
          onClick={() => navigator.share?.({
            title: entry.headword,
            text: `${entry.headword} — ${entry.gloss}`,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          })}
          className="px-3 py-1.5 text-sm border border-ink/15 rounded-md hover:bg-paper transition-colors"
        >
          Share
        </button>
        <button
          onClick={() => setShowSuggest(true)}
          className="px-3 py-1.5 text-sm border border-ink/15 rounded-md hover:bg-paper transition-colors"
        >
          Suggest correction
        </button>
        {entry.review_flags.length > 0 && (
          <span className="ml-auto self-center text-xs text-amber-700 italic">
            ⚠ Flagged: {entry.review_flags.join(', ')}
          </span>
        )}
      </footer>

      {showSuggest && (
        <SuggestCorrectionModal entry={entry} onClose={() => setShowSuggest(false)} />
      )}
    </article>
  );
}
