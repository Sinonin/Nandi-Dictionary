'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SuggestNewEntryModal({
  initialQuery,
  onClose,
}: {
  initialQuery: string;
  onClose: () => void;
}) {
  const [headword, setHeadword] = useState(initialQuery);
  const [gloss, setGloss] = useState('');
  const [example, setExample] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const trimmedHead = headword.trim();
      // Synthesise an entry_id with the `new_` prefix the API requires.
      const entryId =
        'new_' +
        trimmedHead
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_entry',
          entry_id: entryId,
          proposed_value: JSON.stringify({
            headword: trimmedHead,
            gloss: gloss.trim() || null,
            example: example.trim() || null,
          }),
          reporter_name: name.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      toast.success('Kongoi Mising. Kibagenge ko Kimnon.', {
        description: 'Thank you very much. Togetherness is more power.',
        duration: 6000,
      });
      onClose();
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
        className="bg-paper-card w-full max-w-md rounded-xl border border-ink/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <h2 className="text-lg font-medium mb-1">Suggest a new entry</h2>
          <p className="text-xs text-ink-faint mb-4">
            We don&rsquo;t have this word yet. Help us add it.
          </p>

          <label className="block text-sm mb-1">Headword (Nandi)</label>
          <input
            value={headword}
            onChange={(e) => setHeadword(e.target.value)}
            required
            autoFocus
            className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm font-mono"
          />

          <label className="block text-sm mb-1">Meaning / English gloss (optional)</label>
          <input
            value={gloss}
            onChange={(e) => setGloss(e.target.value)}
            placeholder="e.g. to strain, milk-strainer…"
            className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
          />

          <label className="block text-sm mb-1">Example sentence (optional)</label>
          <textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            rows={2}
            placeholder="A sentence using the word, if you know one"
            className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
          />

          <label className="block text-sm mb-1">Your name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Elias, Victor, Cherop…"
            className="w-full mb-4 px-3 py-2 border border-ink/15 rounded-md text-sm"
          />

          {status === 'error' && (
            <p className="text-sm text-red-700 mb-3">Could not send: {errMsg}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-ink/15 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'sending' || !headword.trim()}
              className="px-3 py-1.5 text-sm bg-accent text-white rounded-md disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
