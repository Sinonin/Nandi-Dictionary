#!/usr/bin/env node
// compare-with-creider.js
// Cross-references the dictionary corpus against Creider & Creider (1989)
// extracted reference data, producing two outputs:
//
//   1. creider-missing-in-corpus.csv
//      Creider entries with no plausible match in the corpus. Candidates for
//      addition.
//
//   2. creider-marks-suggested.csv
//      Corpus entries that match a Creider entry on the bare (stripped) form
//      but lack the diacritic and length marks Creider records. Reviewers
//      can accept or reject each suggested mark restoration.
//
// Usage (from scripts/ in the scaffold directory):
//   node compare-with-creider.js
//
// Output files land in the scaffold root.

const fs = require('fs');
const path = require('path');

const creider = require('./creider-reference.js');
const corpusPath = path.join(__dirname, '..', 'public', 'corpus.json');
const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

// --- helpers ---------------------------------------------------------------

// Strip diacritics, length marks, and morpheme boundaries to a comparable bare
// form. "lókó-yà:" → "lokoya"; "kwà:ny" → "kwany".
function bare(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // combining diacritics
    .replace(/[:\-_'`’´ʼ]/g, '')        // length marks, hyphens, apostrophes
    .replace(/[^a-z]/g, '');            // keep only ascii letters
}

// Detect whether a form carries any of Creider's marks.
function hasMarks(s) {
  if (!s) return false;
  return /[áéíóúâêîôûàèìòù:]/.test(s);
}

// Crude gloss similarity: shared content words.
function glossOverlap(a, b) {
  if (!a || !b) return 0;
  const stops = new Set(['a','an','the','of','to','in','on','for','with','and','or','is','it']);
  const tokens = s => new Set(
    s.toLowerCase()
     .replace(/[^a-z\s]/g, ' ')
     .split(/\s+/)
     .filter(w => w.length > 2 && !stops.has(w))
  );
  const sa = tokens(a);
  const sb = tokens(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared / Math.min(sa.size, sb.size);
}

function csv(s) {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

// --- build corpus index ---------------------------------------------------

// Map from bare form to array of corpus entries with that bare form.
const corpusByBare = new Map();
for (const entry of corpus) {
  const b = bare(entry.headword);
  if (!b) continue;
  if (!corpusByBare.has(b)) corpusByBare.set(b, []);
  corpusByBare.get(b).push(entry);
}

// --- compare ---------------------------------------------------------------

const missing = [];
const suggestedMarks = [];

for (const c of creider) {
  // Try both primary and secondary forms for matching.
  const candidates = [c.form_primary, c.form_secondary].filter(Boolean);
  let matched = false;
  let bestMatches = [];

  for (const form of candidates) {
    const b = bare(form);
    if (!b) continue;
    const hits = corpusByBare.get(b) || [];
    if (hits.length > 0) {
      matched = true;
      bestMatches = bestMatches.concat(hits.map(h => ({ hit: h, viaForm: form })));
    }
  }

  if (!matched) {
    missing.push({
      creider_primary: c.form_primary,
      creider_secondary: c.form_secondary || '',
      gloss: c.gloss,
      pos: c.pos,
      number: c.number || '',
      source_page: c.source_page,
      notes: c.notes || ''
    });
    continue;
  }

  // For each match, check whether the corpus entry could benefit from
  // restored marks.
  for (const { hit, viaForm } of bestMatches) {
    const creiderHasMarks = hasMarks(viaForm);
    const corpusHasMarks = hasMarks(hit.headword);

    if (creiderHasMarks && !corpusHasMarks) {
      const overlap = glossOverlap(hit.gloss, c.gloss);
      suggestedMarks.push({
        corpus_id: hit.id,
        corpus_page: hit.page,
        corpus_headword: hit.headword,
        corpus_pos: hit.pos,
        corpus_gloss: hit.gloss,
        creider_primary: c.form_primary,
        creider_secondary: c.form_secondary || '',
        creider_gloss: c.gloss,
        creider_pos: c.pos,
        creider_page: c.source_page,
        gloss_overlap: overlap.toFixed(2),
        confidence: overlap >= 0.34 ? 'HIGH' : overlap > 0 ? 'MEDIUM' : 'LOW',
        notes: c.notes || ''
      });
    }
  }
}

// --- write CSVs ------------------------------------------------------------

function writeCSV(filename, headers, rows) {
  const lines = [headers.map(csv).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => csv(row[h])).join(','));
  }
  const outPath = path.join(__dirname, '..', filename);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  return outPath;
}

const missingHeaders = ['creider_primary','creider_secondary','gloss','pos','number','source_page','notes'];
const suggestedHeaders = ['confidence','gloss_overlap','corpus_id','corpus_page','corpus_headword','corpus_pos','corpus_gloss','creider_primary','creider_secondary','creider_gloss','creider_pos','creider_page','notes'];

// Sort missing by POS then alphabetically.
missing.sort((a, b) => {
  if (a.pos !== b.pos) return a.pos.localeCompare(b.pos);
  return bare(a.creider_primary).localeCompare(bare(b.creider_primary));
});

// Sort suggestions: HIGH confidence first, then MEDIUM, then LOW; within each
// group by gloss overlap descending.
suggestedMarks.sort((a, b) => {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  if (order[a.confidence] !== order[b.confidence]) {
    return order[a.confidence] - order[b.confidence];
  }
  return parseFloat(b.gloss_overlap) - parseFloat(a.gloss_overlap);
});

const missingPath = writeCSV('creider-missing-in-corpus.csv', missingHeaders, missing);
const suggestedPath = writeCSV('creider-marks-suggested.csv', suggestedHeaders, suggestedMarks);

// --- report ----------------------------------------------------------------

console.log('Creider reference entries: ' + creider.length);
console.log('Corpus entries:            ' + corpus.length);
console.log('');
console.log('Wrote: ' + missingPath);
console.log('  ' + missing.length + ' Creider entries appear missing from the corpus.');
console.log('');
console.log('Wrote: ' + suggestedPath);
console.log('  ' + suggestedMarks.length + ' corpus entries have a Creider match with marks to restore.');

const byConf = { HIGH: 0, MEDIUM: 0, LOW: 0 };
for (const s of suggestedMarks) byConf[s.confidence]++;
console.log('  Confidence breakdown:');
console.log('    HIGH (gloss overlaps strongly):   ' + byConf.HIGH);
console.log('    MEDIUM (some gloss overlap):      ' + byConf.MEDIUM);
console.log('    LOW (form matches, gloss does not): ' + byConf.LOW);

console.log('');
console.log('By POS in missing CSV:');
const byPos = {};
for (const m of missing) byPos[m.pos] = (byPos[m.pos] || 0) + 1;
for (const [pos, count] of Object.entries(byPos).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + pos.padEnd(8) + count);
}
