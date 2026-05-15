'use client';

import { useState } from 'react';

const POS_OPTIONS = [
  { v: 'noun', label: 'noun' },
  { v: 'verb', label: 'verb' },
  { v: 'verb_transitive', label: 'verb (transitive)' },
  { v: 'verb_intransitive', label: 'verb (intransitive)' },
  { v: 'adjective', label: 'adjective' },
  { v: 'adverb', label: 'adverb' },
  { v: 'pronoun', label: 'pronoun' },
  { v: 'preposition', label: 'preposition' },
  { v: 'conjunction', label: 'conjunction' },
  { v: 'interjection', label: 'interjection' },
  { v: 'other', label: 'other / not sure' },
];

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9'_]/g, '')
    .slice(0, 40);
}

export default function SuggestNewEntryModal({
  query, onClose,
}: { query: string; onClose: () => void }) {
  const [headword, setHeadword] = useState(query);
  const [pos, setPos] = useState('noun');
  const [gloss, setGloss] = useState('');
  const [exNandi, setExNandi] = useState('');
  const [exEnglish, setExEnglish] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const slug = slugify(headword);
      if (!slug) throw new Error('Headword cannot be empty');
      const entry_id = 'new_' + slug;
      const proposed = {
        headword: headword.trim(),
        pos,
        gloss: gloss.trim(),
        example_nandi: exNandi.trim(),
        example_english: exEnglish.trim(),
      };
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id,
          type: 'new_entry',
          proposed_value: JSON.stringify(proposed),
          reporter_name: name,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper-card w-full max-w-md rounded-xl border border-ink/10 p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'sent' ? (
          <>
            <h2 className="text-lg font-medium mb-2">Contribution received</h2>
            <p className="text-sm text-ink-muted mb-2">
              Your contribution for <strong>{headword}</strong> is welcomed. <em>Kiruogindet araap Cheison and Team</em> review all additions and corrections.
            </p>
            <p className="text-xs text-ink-faint mb-4">
              If accepted, it joins the permanent dictionary in the next update. You will see your name credited if you provided one.
            </p>
            <button onClick={onClose} className="px-3 py-1.5 text-sm border border-ink/15 rounded-md">
              Close
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-lg font-medium mb-1">Propose a new entry</h2>
            <p className="text-xs text-ink-faint mb-4 leading-relaxed">
              You are contributing a word to the Nandi Digital Dictionary. Please fill in what you know &mdash; only the headword and meaning are required.
            </p>

            <label className="block text-sm mb-1">Headword (the Nandi word)</label>
            <input
              value={headword}
              onChange={(e) => setHeadword(e.target.value)}
              required
              autoFocus
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            <label className="block text-sm mb-1">Part of speech</label>
            <select
              value={pos}
              onChange={(e) => setPos(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md bg-paper-card text-sm"
            >
              {POS_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.label}</option>
              ))}
            </select>

            <label className="block text-sm mb-1">Meaning in English</label>
            <textarea
              value={gloss}
              onChange={(e) => setGloss(e.target.value)}
              required
              rows={2}
              placeholder="What does this word mean?"
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            <label className="block text-sm mb-1">Example sentence in Nandi (optional)</label>
            <input
              value={exNandi}
              onChange={(e) => setExNandi(e.target.value)}
              placeholder="A sentence using this word"
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            <label className="block text-sm mb-1">English translation of the example (optional)</label>
            <input
              value={exEnglish}
              onChange={(e) => setExEnglish(e.target.value)}
              placeholder="What the example sentence means"
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            <label className="block text-sm mb-1">Your name (optional &mdash; for attribution)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elias, Victor, Cherop..."
              className="w-full mb-4 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            {status === 'error' && (
              <p className="text-sm text-red-700 mb-3">Could not send: {errMsg}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose}
                className="px-3 py-1.5 text-sm border border-ink/15 rounded-md">
                Cancel
              </button>
              <button type="submit" disabled={status === 'sending' || !headword.trim() || !gloss.trim()}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md disabled:opacity-50">
                {status === 'sending' ? 'Submitting...' : 'Submit entry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

