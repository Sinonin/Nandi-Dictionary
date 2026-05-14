const fs = require('fs');
const path = require('path');

const CORPUS_PATH = path.join(__dirname, '..', 'public', 'corpus.json');
const OUT_DIR = path.join(__dirname, '..', 'splits-output');
const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));

const POS_TOKENS = ['v','n','a','adj','adv','prep','conj','pron','pn','num','interj','part','aux'];
const POS_TO_FULL = {
  v:'verb', n:'noun', a:'adjective', adj:'adjective',
  adv:'adverb', prep:'preposition', conj:'conjunction',
  pron:'pronoun', pn:'pronoun', num:'numeral',
  interj:'interjection', part:'particle', aux:'auxiliary'
};

const ghostRawRx = new RegExp(
  "^[a-z\u00F1'\\-]+(?:\\s+[a-z\u00F1'\\-]+)*(?:\\s*\\([^)]+\\))?(?:\\s+[a-z\u00F1'\\-]+)*\\s*(?:" + POS_TOKENS.join('|') + ")(?:\\.[a-z.]*)?\\.\\s*$",
  'i'
);

function isGhostRawRow(ex) {
  return ex && ex.raw && ghostRawRx.test(ex.raw.trim());
}

function parseHeader(rawStr) {
  const parseRx = new RegExp(
    "^([a-z\u00F1'\\-]+(?:\\s+[a-z\u00F1'\\-]+)*?)(?:\\s*\\(([^)]+)\\))?(?:\\s+([a-z\u00F1'\\-]+))?\\s*(" + POS_TOKENS.join('|') + ")((?:\\.[a-z]+)*)\\.\\s*$",
    'i'
  );
  const m = rawStr.trim().match(parseRx);
  if (!m) return null;
  const headword = m[1].trim();
  const pos = m[4].toLowerCase();
  const subPos = m[5] ? m[5].toLowerCase().split('.').filter(Boolean) : [];
  let posFull = POS_TO_FULL[pos] || pos;
  let posRaw = pos + '.';
  if (subPos.length > 0) {
    posRaw += subPos.join('.') + '.';
    if (pos === 'v' && (subPos.includes('t') || subPos.includes('tv') || subPos.includes('vt'))) posFull = 'verb_transitive';
    if (pos === 'v' && (subPos.includes('i') || subPos.includes('itv') || subPos.includes('vi'))) posFull = 'verb_intransitive';
    if (pos === 'v' && subPos.includes('instr')) posFull = 'verb_instrumental';
    if (pos === 'v' && subPos.includes('app')) posFull = 'verb_applicative';
  }
  return { headword, pos: posFull, pos_raw: posRaw };
}

function splitRunOn(eng) {
  if (!eng) return null;
  const m = eng.match(/^(.+?[.!?])\s+([A-Z(].*)$/);
  if (m) return { nandi: m[1].trim(), english: m[2].trim() };
  return { raw: eng.trim() };
}

function cleanGloss(raw) {
  if (!raw) return '';
  let g = raw.trim();
  // strip leading numbered sense like "1. " or "2. "
  g = g.replace(/^\d+\.\s*/, '');
  // fix OCR-mashed "to" word like "tobuy" → "to buy"
  g = g.replace(/^to(?=[a-z])/i, 'to ');
  // trim trailing period
  g = g.replace(/\.\s*$/, '');
  return g;
}

function slugify(hw) {
  return hw.replace(/-/g, '_').replace(/\s+/g, '_').replace(/[^a-z0-9'_\u00F1]/gi, '');
}

function posSuffix(posRaw) {
  return posRaw.replace(/\./g, '').toLowerCase();
}

function reconstructGhost(headerRow, tailRows, parent) {
  const parsed = parseHeader(headerRow.raw);
  if (!parsed) {
    return { confidence: 'low', reason: 'unparseable-header', rawRows: [headerRow, ...tailRows], parentId: parent.id };
  }
  let gloss = '';
  let exampleObj = null;
  let confidence = 'medium';
  const flags = ['split-from-' + parent.id];

  for (const row of tailRows) {
    // Try nandi field as gloss
    if (!gloss && row.nandi) {
      const candidate = cleanGloss(row.nandi);
      if (candidate.length >= 2) {
        gloss = candidate;
        if (row.english) {
          const split = splitRunOn(row.english);
          if (split.nandi && split.english) {
            exampleObj = { nandi: split.nandi, english: split.english, phonetic: row.phonetic || '' };
            confidence = 'high';
          } else if (split.raw) {
            exampleObj = { raw: split.raw, phonetic: row.phonetic || '' };
            flags.push('example-unsplit');
          }
        }
        break;
      }
    }
    // Fallback: try to extract gloss from raw
    if (!gloss && row.raw) {
      const candidate = cleanGloss(row.raw);
      // Take everything up to the first comma+lowercase-word (likely an example follows)
      const splitPoint = candidate.search(/,\s+[a-z\u00F1'\-]+\s+[a-z]/i);
      if (splitPoint > 0) {
        gloss = candidate.slice(0, splitPoint).trim();
      } else {
        // Take just the first sentence-like fragment
        const periodSplit = candidate.split(/\.\s+/)[0];
        if (periodSplit.length > 2 && periodSplit.length < 100) {
          gloss = periodSplit.trim();
        }
      }
      if (gloss) {
        flags.push('gloss-from-raw');
      }
    }
    if (gloss) break;
  }
  if (!gloss) {
    confidence = 'low';
    flags.push('no-gloss-found');
  }
  const id = 'p' + parent.page + '_' + slugify(parsed.headword) + '_' + posSuffix(parsed.pos_raw);
  const newEntry = {
    id, page: parent.page, headword: parsed.headword,
    pos: parsed.pos, pos_raw: parsed.pos_raw,
    phonetic_forms: headerRow.phonetic ? [headerRow.phonetic] : [],
    gloss: gloss || '(reconstruction incomplete)',
    examples: exampleObj ? [exampleObj] : [],
    review_flags: flags,
    section_hdr: parsed.headword
  };
  return { confidence, entry: newEntry, parentId: parent.id, headerRowRaw: headerRow.raw, originalRows: [headerRow, ...tailRows] };
}

const cleanedEntries = [];
const highConfidence = [];
const needsReview = [];
const unparseable = [];
let parentsCleaned = 0, splitAttempts = 0;

for (const entry of corpus) {
  const exs = entry.examples || [];
  const ghostIdx = [];
  for (let i = 0; i < exs.length; i++) if (isGhostRawRow(exs[i])) ghostIdx.push(i);
  if (ghostIdx.length === 0) { cleanedEntries.push(entry); continue; }

  // Start parent with the rows BEFORE the first ghost
  const keptExamples = [...exs.slice(0, ghostIdx[0])];

  for (let g = 0; g < ghostIdx.length; g++) {
    const startIdx = ghostIdx[g];
    const endIdx = g < ghostIdx.length - 1 ? ghostIdx[g + 1] - 1 : exs.length - 1;
    const headerRow = exs[startIdx];
    const tailRows = exs.slice(startIdx + 1, endIdx + 1);
    const groupRows = [headerRow, ...tailRows];
    splitAttempts++;
    const result = reconstructGhost(headerRow, tailRows, entry);
    if (result.confidence === 'high') {
      highConfidence.push(result.entry);
      // remove from parent: do nothing (don't push back)
    } else if (result.confidence === 'medium' && result.entry) {
      needsReview.push(result);
      // KEEP in parent until human approval through suggestions
      keptExamples.push(...groupRows);
    } else {
      unparseable.push(result);
      // KEEP in parent (no data loss)
      keptExamples.push(...groupRows);
    }
  }
  parentsCleaned++;
  cleanedEntries.push({ ...entry, examples: keptExamples });
}

const proposedCorpus = [...cleanedEntries, ...highConfidence];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'proposed-corpus.json'), JSON.stringify(proposedCorpus, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'splits-needs-review.json'), JSON.stringify(needsReview, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'splits-unparseable.json'), JSON.stringify(unparseable, null, 2), 'utf8');

const kb = p => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log('================================================================');
console.log('  Nandi Dictionary -- Ghost Splitter v2 Report (DRY RUN)');
console.log('================================================================');
console.log('');
console.log('Original corpus:                       ' + corpus.length + ' entries');
console.log('Parent entries cleaned:                ' + parentsCleaned);
console.log('Ghost split attempts:                  ' + splitAttempts);
console.log('  High confidence (auto-merge):        ' + highConfidence.length);
console.log('  Medium confidence (needs review):    ' + needsReview.length);
console.log('  Unparseable (kept in parent):        ' + unparseable.length);
console.log('');
console.log('Proposed corpus size:                  ' + proposedCorpus.length + ' entries');
console.log('Net new entries:                       ' + (proposedCorpus.length - corpus.length));
console.log('');
console.log('Outputs:');
console.log('  proposed-corpus.json      ' + kb(path.join(OUT_DIR, 'proposed-corpus.json')));
console.log('  splits-needs-review.json  ' + kb(path.join(OUT_DIR, 'splits-needs-review.json')));
console.log('  splits-unparseable.json   ' + kb(path.join(OUT_DIR, 'splits-unparseable.json')));
console.log('');
console.log('--- 10 SAMPLE HIGH-CONFIDENCE RECONSTRUCTIONS ---');
console.log('');
const step = Math.max(1, Math.floor(highConfidence.length / 10));
let shown = 0;
for (let i = 0; i < highConfidence.length && shown < 10; i += step, shown++) {
  const e = highConfidence[i];
  console.log('[' + (i + 1) + '/' + highConfidence.length + '] ' + e.id + '  (p.' + e.page + ')');
  console.log('     ' + e.headword + '  [' + e.pos + ']');
  if (e.phonetic_forms.length) console.log('     /' + e.phonetic_forms.join('/, /') + '/');
  console.log('     gloss: ' + e.gloss);
  if (e.examples[0]) {
    if (e.examples[0].nandi) {
      console.log('     ex:    "' + e.examples[0].nandi + '" -- ' + e.examples[0].english);
    } else if (e.examples[0].raw) {
      console.log('     ex:    (raw) "' + e.examples[0].raw + '"');
    }
  }
  console.log('');
}
console.log('================================================================');
