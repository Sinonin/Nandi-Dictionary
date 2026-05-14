import SearchBar from '@/components/SearchBar';
import { entries, byLetter } from '@/lib/corpus';
import Link from 'next/link';

// Deterministic word-of-the-day — same word for all users on a given day
function wordOfTheDay() {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const cleanEntries = entries.filter(
    (e) => e.review_flags.length === 0 && e.examples.length > 0
  );
  return cleanEntries[seed % cleanEntries.length];
}

export default function HomePage() {
  const wotd = wordOfTheDay();
  const letters = Object.keys(byLetter).sort();
  const totalEntries = entries.length;
  const totalExamples = entries.reduce((n, e) => n + e.examples.length, 0);

  return (
    <div className="space-y-8">
      <section>
        <SearchBar />
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wide text-ink-faint mb-2">Word of the day</h2>
        <Link
          href={`/entry/${wotd.id}`}
          className="block bg-paper-card border border-ink/10 rounded-xl p-5 hover:border-ink/25 transition-colors"
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl font-medium">{wotd.headword}</span>
            <span className="text-xs italic text-ink-faint">{wotd.pos.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-sm text-ink-muted">{wotd.gloss}</p>
          {wotd.examples[0]?.nandi && (
            <p className="text-sm mt-2 italic text-ink-muted">
              &ldquo;{wotd.examples[0].nandi}&rdquo; &mdash; {wotd.examples[0].english}
            </p>
          )}
        </Link>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wide text-ink-faint mb-2">Browse</h2>
        <div className="flex flex-wrap gap-1">
          {letters.map((l) => (
            <Link
              key={l}
              href={`/browse/${l}`}
              className="px-3 py-1.5 text-sm font-mono border border-ink/10 rounded-md hover:bg-paper-card transition-colors"
            >
              {l}
              <span className="ml-1 text-xs text-ink-faint">{byLetter[l].length}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="text-xs text-ink-faint border-t border-ink/10 pt-4">
        <p>
          {totalEntries.toLocaleString()} entries · {totalExamples.toLocaleString()} example sentences
        </p>
      </section>
    </div>
  );
}
