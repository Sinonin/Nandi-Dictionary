'use client';

import { Entry } from '@/lib/corpus';
import { useState } from 'react';

const ISSUE_TYPES = [
  { v: 'diacritic', label: 'Wrong / missing diacritic' },
  { v: 'gloss', label: 'Gloss wrong or incomplete' },
  { v: 'example', label: 'Example wrong' },
  { v: 'ocr', label: 'OCR letter error' },
  { v: 'new_sense', label: 'Missing sense / meaning' },
  { v: 'other', label: 'Other' },
];

export default function SuggestCorrectionModal({
  entry, onClose,
}: { entry: Entry; onClose: () => void }) {
  const [type, setType] = useState('diacritic');
  const [current, setCurrent] = useState('');
  const [proposed, setProposed] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entry.id,
          type, current_value: current, proposed_value: proposed,
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
        className="bg-paper-card w-full max-w-md rounded-xl border border-ink/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'sent' ? (
          <>
            <h2 className="text-lg font-medium mb-2">Sent</h2>
            <p className="text-sm text-ink-muted mb-4">
              <em>Kiruogindet araap Cheison and Team</em> welcome your additions and corrections.
            </p>
            <button onClick={onClose} className="px-3 py-1.5 text-sm border border-ink/15 rounded-md">
              Close
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-lg font-medium mb-1">Suggest correction</h2>
            <p className="text-xs text-ink-faint mb-4 font-mono">{entry.headword} Â· {entry.id}</p>

            <label className="block text-sm mb-1">Issue type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md bg-paper-card text-sm"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t.v} value={t.v}>{t.label}</option>
              ))}
            </select>

            <label className="block text-sm mb-1">Current (optional)</label>
            <input
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="What the entry says now"
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            <label className="block text-sm mb-1">Proposed correction</label>
            <textarea
              value={proposed}
              onChange={(e) => setProposed(e.target.value)}
              required
              rows={3}
              placeholder="What it should say"
              className="w-full mb-3 px-3 py-2 border border-ink/15 rounded-md text-sm"
            />

            <label className="block text-sm mb-1">Your name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elias, Victor, Cheropâ€¦"
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
              <button type="submit" disabled={status === 'sending' || !proposed.trim()}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded-md disabled:opacity-50">
                {status === 'sending' ? 'Sendingâ€¦' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

