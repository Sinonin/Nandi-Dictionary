import { byLetter } from '@/lib/corpus';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return Object.keys(byLetter).map((l) => ({ letter: l }));
}

export default async function BrowsePage({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const list = byLetter[letter];
  if (!list) notFound();
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">&larr; Back to search</Link>
      <h1 className="text-2xl font-medium">
        {letter.toUpperCase()} <span className="text-base font-normal text-ink-faint">· {list.length} entries</span>
      </h1>
      <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg bg-paper-card overflow-hidden">
        {list
          .slice()
          .sort((a, b) => a.headword.localeCompare(b.headword))
          .map((e) => (
            <li key={e.id}>
              <Link href={`/entry/${e.id}`} className="block px-4 py-3 hover:bg-paper transition-colors">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{e.headword}</span>
                  <span className="text-xs text-ink-faint italic flex-shrink-0">{e.pos.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm text-ink-muted mt-0.5 line-clamp-1">{e.gloss}</p>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
