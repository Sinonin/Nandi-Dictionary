const fs = require('fs');
const path = require('path');

const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'corpus.json'), 'utf8'));

function csv(s) {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

const ghostRx = new RegExp(
  "^[a-z\u00F1'\\-]+(?:\\s+[a-z\u00F1'\\-]+)*\\s*(?:v|n|a|adj|adv|prep|conj|pron|num|interj)(?:\\.[a-z.]*)?\\.\\s*$",
  'i'
);

function concerns(e) {
  const c = [];
  if (e.review_flags && e.review_flags.some(f => typeof f === 'string' && f.startsWith('split-from-'))) c.push('RECONSTRUCTED');
  const hasGhosts = (e.examples || []).some(ex => ex.raw && ghostRx.test(ex.raw.trim()));
  if (hasGhosts) c.push('HAS-GHOSTS');
  if (e.gloss && /\s+[VvNn](\.|i|t|tv|itv|app)?\s*\.?\s*$/.test(e.gloss)) c.push('GLOSS-LEAK');
  if (e.gloss && /\(\s*see\s+/i.test(e.gloss)) c.push('CROSS-REF');
  if (e.gloss && e.gloss.includes('reconstruction incomplete')) c.push('INCOMPLETE');
  if (e.headword && /[A-Z]/.test(e.headword.slice(1))) c.push('OCR-CASE');
  return c.length > 0 ? c.join('|') : 'CLEAN';
}

const headers = [
  'id','page','headword','pos','gloss','phonetic',
  'example_nandi','example_english','concern',
  'reviewer_action','corrected_headword','corrected_pos','corrected_gloss',
  'corrected_phonetic','corrected_example_nandi','corrected_example_english',
  'splits_into','reviewer_notes','reviewer_name'
];

const sorted = [...corpus].sort((a, b) => {
  if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
  return (a.headword || '').localeCompare(b.headword || '');
});

const lines = [headers.map(csv).join(',')];
const counts = {};

for (const e of sorted) {
  const c = concerns(e);
  counts[c] = (counts[c] || 0) + 1;
  const firstEx = (e.examples || [])[0] || {};
  const phon = (e.phonetic_forms || []).join(' ; ');
  lines.push([
    e.id, e.page, e.headword, e.pos, e.gloss, phon,
    firstEx.nandi || '', firstEx.english || firstEx.raw || '',
    c,
    '','','','','','','','','',''
  ].map(csv).join(','));
}

fs.writeFileSync(path.join(__dirname, '..', 'corpus-audit.csv'), lines.join('\n'), 'utf8');
console.log('Wrote corpus-audit.csv (' + sorted.length + ' rows)');
console.log('');
console.log('Concern breakdown:');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log('  ' + k.padEnd(30) + v);
});
