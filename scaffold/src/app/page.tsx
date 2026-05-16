import SearchBar from '@/components/SearchBar';
import { entries } from '@/lib/corpus';
import Link from 'next/link';

// Re-render at most once a minute, so the Word of the Day flips over
// shortly after Africa/Nairobi midnight without a redeploy.
export const revalidate = 60;

/**
 * Day-of-year style integer keyed to Africa/Nairobi local date.
 * Using Intl avoids any UTC drift — at 00:00 EAT we get a new key,
 * regardless of where the server itself thinks it is.
 */
function nairobiDayKey(): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
  const d = parseInt(parts.find((p) => p.type === 'day')!.value, 10);
  // Whole days since the Unix epoch, computed from the Nairobi calendar date.
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

// Deterministic word-of-the-day — same word for all users on a given Nairobi day.
function wordOfTheDay() {
  const seed = nairobiDayKey();
  const cleanEntries = entries.filter(
    (e) => e.review_flags.length === 0 && e.examples.length > 0
  );
  return cleanEntries[seed % cleanEntries.length];
}

export default function HomePage() {
  const wotd = wordOfTheDay();
  const totalEntries = entries.length;
  const totalExamples = entries.reduce((n, e) => n + e.examples.length, 0);

  return (
    <div className="space-y-8">
      <section>
        <SearchBar />
      </section>

      <section>
        <h2 className="text-[15px] uppercase tracking-wide text-ink-faint mb-2 font-semibold">
          Ng&apos;olyotab Kamanuut Rani
        </h2>
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

      <section className="text-xs text-ink-faint border-t border-ink/10 pt-4">
        <p>
          {totalEntries.toLocaleString()} words &middot; {totalExamples.toLocaleString()} example sentences
        </p>
      </section>
    </div>
  );
}
