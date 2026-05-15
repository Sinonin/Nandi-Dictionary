const fs = require('fs');
const path = require('path');

const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'corpus.json'), 'utf8'));

const DENY = [
  'vulva','vagina','penis','testicle','scrotum','clitoris','genital',
  ' sex ','sexual','intercourse','copulat','fornicat','adultery','prostitut',
  ' virgin','seduce','rape','molest',
  'urinat','urine','defecat','feces','faeces','dung','excrement','piss','shit',
  'menstrual','menstruat','menses','semen','sperm','ejaculat','erection',
  'breast','nipple','areola','buttock','anus','arse','rectum',
  'fuck','damn','bastard','bitch',
  'murder','slaughter','rapist',
  'drunk','intoxicat','beer ','liquor ',
  ' idiot',' stupid','fool '
];

function hasDeny(text) {
  if (!text) return false;
  const t = ' ' + text.toLowerCase() + ' ';
  return DENY.some(d => t.includes(d.toLowerCase()));
}

function isContaminated(text) {
  if (!text) return true;
  const t = text.trim();
  if (t.length < 3 || t.length > 120) return true;
  // POS-marker leak at the END of the gloss: ends with bare v/V/n/N
  if (/\s+[VvNn](\.|i|t|tv|itv|app)?\s*\.?\s*$/.test(t)) return true;
  // POS-marker leak with preceding Nandi-looking word
  if (/[,.]\s+[a-z\u00F1'\-]+\s+[VvNn](\.|\s|$)/.test(t)) return true;
  // Cross-reference leak
  if (/\(\s*see\s+[a-z\u00F1'\-]+/i.test(t)) return true;
  // Trailing fragment like "ke-X" or "ko-X" — verb form leaked in
  if (/\s+k[oei]?-[a-z\u00F1'\-]+\s*$/i.test(t)) return true;
  // Multiple "tilde" symbols (~) — OCR oddity
  if (/~/.test(t)) return true;
  return false;
}

function isCandidate(e) {
  if (!e.gloss || e.gloss.includes('reconstruction incomplete')) return false;
  if (e.review_flags && e.review_flags.length > 0) return false;
  if (isContaminated(e.gloss)) return false;
  const hasEx = (e.examples || []).some(ex =>
    ex.nandi && ex.english &&
    !hasDeny(ex.nandi) && !hasDeny(ex.english) &&
    !isContaminated(ex.english)
  );
  if (!hasEx) return false;
  const hw = e.headword || '';
  if (hw.length < 3 || hw.length > 12) return false;
  const safePOS = ['noun', 'adjective', 'verb', 'verb_transitive', 'verb_intransitive'];
  if (!safePOS.includes(e.pos)) return false;
  if (hasDeny(e.gloss)) return false;
  if (!e.phonetic_forms || e.phonetic_forms.length === 0) return false;
  return true;
}

const candidates = corpus.filter(isCandidate);
candidates.sort((a, b) => (a.headword || '').localeCompare(b.headword || ''));

const TARGET = 80;
const step = Math.max(1, Math.floor(candidates.length / TARGET));
const sampled = [];
for (let i = 0; i < candidates.length && sampled.length < TARGET; i += step) {
  sampled.push(candidates[i]);
}

const output = {
  generated_at: new Date().toISOString(),
  total_corpus: corpus.length,
  total_candidates: candidates.length,
  sampled: sampled.length,
  entries: sampled.map(e => ({
    id: e.id, headword: e.headword, pos: e.pos, gloss: e.gloss,
    example_nandi: (e.examples && e.examples[0] && e.examples[0].nandi) || '',
    example_english: (e.examples && e.examples[0] && e.examples[0].english) || ''
  }))
};

fs.writeFileSync(path.join(__dirname, '..', 'wotd-candidates.json'), JSON.stringify(output, null, 2), 'utf8');

console.log("Ng'olyoo ne oo Rani -- Candidate Pool v2");
console.log('=================================================');
console.log('Corpus size:           ' + corpus.length);
console.log('Passed strict filter:  ' + candidates.length);
console.log('Sampled:               ' + sampled.length);
console.log('');
console.log('--- First 20 candidates ---');
sampled.slice(0, 20).forEach((e, i) => {
  console.log((i+1) + '. ' + e.headword + '  (' + e.pos + ')  -- ' + e.gloss);
});
