import EntryCard from '@/components/EntryCard';
import { byId, entries } from '@/lib/corpus';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return entries.map((e) => ({ id: e.id }));
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = byId.get(id);
  if (!entry) notFound();
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">&larr; Back to search</Link>
      <EntryCard entry={entry} />
    </div>
  );
}
