import SearchBar from '@/components/SearchBar';
import { entries, byId } from '@/lib/corpus';
import { WOTD_POOL } from '@/lib/wotd-pool';
import Link from 'next/link';

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 1000 * 60 * 60 * 24;

function wordOfTheDay() {
  const nowEAT = Date.now() + EAT_OFFSET_MS;
  const dayIndex = Math.floor(nowEAT / DAY_MS);
  const poolEntries = WOTD_POOL.map((id) => byId.get(id)).filter((e) => e !== undefined);
  if (poolEntries.length > 0) {
    return poolEntries[dayIndex % poolEntries.length]!;
  }
  const cleanEntries = entries.filter(
    (e) => e.review_flags.length === 0 && e.examples.length > 0
  );
  return cleanEntries[dayIndex % cleanEntries.length];
}

export default function HomePage() {
  const wotd = wordOfTheDay();
  const totalEntries = entries.length;
  const totalExamples = entries.reduce((n, e) => n + e.examples.length, 0);

  return (
    <div className="space-y-4">
      <section className="text-center pt-1">
        <p className="text-[26px] italic text-ink-muted font-medium leading-tight">Kibageenge ko Kimnon</p>
        <p className="text-[15px] text-ink-faint mt-1">Togetherness is more power</p>
      </section>
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
          <div className="flex items-baseline justify-between mb-2 gap-3">
            <span className="text-[30px] font-semibold leading-tight">{wotd.headword}</span>
            <span className="text-[14px] italic text-ink-faint flex-shrink-0">{wotd.pos.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-[18px] text-ink-muted leading-relaxed">{wotd.gloss}</p>
          {wotd.examples[0]?.nandi && (
            <p className="text-[17px] mt-3 italic text-ink-muted leading-relaxed">
              &ldquo;{wotd.examples[0].nandi}&rdquo; &mdash; {wotd.examples[0].english}
            </p>
          )}
        </Link>
      </section>
      <section className="text-[15px] text-ink-faint border-t border-ink/10 pt-3 mt-2">
        <p>
          {totalEntries.toLocaleString()} entries &middot; {totalExamples.toLocaleString()} example sentences
        </p>
      </section>
    </div>
  );
}
