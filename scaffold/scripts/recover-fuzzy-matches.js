#!/usr/bin/env node
// recover-fuzzy-matches.js
// Second-pass recovery for Creider entries that appeared missing in the basic
// comparison. Tries variant transformations to find them under different
// spellings in the corpus.
//
// Transformations attempted, in rough order of confidence:
//   - Both primary and secondary bare forms (already tried in pass 1, retried)
//   - Strip common Nandi nominal suffixes (-yat, -yet, -tet, -wet, -ek, etc.)
//   - Strip verb prefixes (ke:-, ki:-) and try alternates
//   - Character substitutions (ny↔n, c↔ch)
//   - Reduce to morphological stem
//
// Each transformation has a confidence weight. The best-scoring match per
// Creider entry is reported, scored by transform-weight × gloss-overlap.

const fs = require('fs');
const path = require('path');

const creider = require('./creider-reference.js');
const corpusPath = path.join(__dirname, '..', 'public', 'corpus.json');
const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

// --- helpers (same as compare-with-creider.js) ----------------------------

function bare(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[:\-_'`’´ʼ]/g, '')
    .replace(/[^a-z]/g, '');
}

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

// --- variant generation ---------------------------------------------------

// For a Creider entry, generate a list of plausible bare-form variants that
// might match a corpus headword, each with a confidence weight.
function generateVariants(c) {
  const variants = new Map(); // bare-form -> { transform, weight }

  const add = (form, transform, weight) => {
    if (!form || form.length < 2) return;
    const existing = variants.get(form);
    if (!existing || existing.weight < weight) {
      variants.set(form, { transform, weight });
    }
  };

  // Common Nandi suffixes to strip. Order matters: longer first.
  const suffixes = [
    ['atinwa',   0.80],
    ['atinwek',  0.80],
    ['tinwek',   0.80],
    ['syek',     0.85],
    ['nik',      0.80],
    ['wek',      0.80],
    ['kik',      0.70],
    ['kek',      0.70],
    ['yat',      0.90],
    ['yet',      0.90],
    ['tet',      0.90],
    ['wet',      0.90],
    ['wa',       0.75],
    ['ek',       0.70],
    ['et',       0.75],
    ['it',       0.75],
    ['ot',       0.70],
    ['at',       0.70],
    ['ta',       0.65],
    ['ka',       0.60],
    ['t',        0.55],  // last-resort terminal -t
  ];

  for (const sourceForm of [c.form_primary, c.form_secondary]) {
    if (!sourceForm) continue;
    const b = bare(sourceForm);
    if (!b) continue;

    // Identity
    add(b, 'bare form', 1.0);

    // Strip suffixes
    for (const [suf, weight] of suffixes) {
      if (b.length > suf.length + 1 && b.endsWith(suf)) {
        add(b.slice(0, -suf.length), `strip -${suf}`, weight);
      }
    }

    // Verb prefix variants. Creider verbs typically appear as ke:-X or ki:-X.
    // The corpus may have stripped the prefix or used the alternate.
    if (b.startsWith('ke')) {
      add(b.slice(2), 'strip ke- prefix', 0.75);
      add('ki' + b.slice(2), 'ke- → ki- prefix', 0.65);
    }
    if (b.startsWith('ki')) {
      add(b.slice(2), 'strip ki- prefix', 0.75);
      add('ke' + b.slice(2), 'ki- → ke- prefix', 0.65);
    }

    // Character substitutions for palatal nasal and palatal stop.
    // ny ↔ n (palatal nasal sometimes flattened in transcription)
    if (b.includes('ny')) {
      add(b.replace(/ny/g, 'n'), 'ny → n', 0.55);
    }
    // c ↔ ch (palatal stop two ways)
    if (b.includes('c')) {
      add(b.replace(/c/g, 'ch'), 'c → ch', 0.65);
    }
    if (b.includes('ch')) {
      add(b.replace(/ch/g, 'c'), 'ch → c', 0.65);
    }
  }

  return Array.from(variants.entries())
    .map(([form, meta]) => ({ form, ...meta }))
    .sort((a, b) => b.weight - a.weight);
}

// --- build corpus index ---------------------------------------------------

const corpusByBare = new Map();
for (const entry of corpus) {
  const b = bare(entry.headword);
  if (!b) continue;
  if (!corpusByBare.has(b)) corpusByBare.set(b, []);
  corpusByBare.get(b).push(entry);
}

// --- recovery pass --------------------------------------------------------

const recovered = [];
const stillMissing = [];

for (const c of creider) {
  // Skip entries already matched in pass 1 (their bare form is in the corpus).
  const primaryBare = bare(c.form_primary);
  const secondaryBare = bare(c.form_secondary || '');
  if (corpusByBare.has(primaryBare) || (secondaryBare && corpusByBare.has(secondaryBare))) {
    continue;
  }

  // Try variants
  const variants = generateVariants(c);
  let bestMatch = null;
  let bestScore = 0;

  for (const v of variants) {
    // Skip identity since it was already checked in pass 1
    if (v.transform === 'bare form') continue;

    const hits = corpusByBare.get(v.form) || [];
    for (const hit of hits) {
      const overlap = glossOverlap(hit.gloss, c.gloss);
      // Score: transform confidence weighted by gloss overlap, with a small
      // floor so transforms with zero gloss overlap still get reported (LOW).
      const score = v.weight * (0.2 + 0.8 * overlap);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          hit,
          variantForm: v.form,
          transform: v.transform,
          transformWeight: v.weight,
          overlap
        };
      }
    }
  }

  if (bestMatch) {
    let confidence;
    if (bestMatch.overlap >= 0.34 && bestMatch.transformWeight >= 0.7) confidence = 'HIGH';
    else if (bestMatch.overlap > 0) confidence = 'MEDIUM';
    else confidence = 'LOW';

    recovered.push({
      confidence,
      transform: bestMatch.transform,
      gloss_overlap: bestMatch.overlap.toFixed(2),
      corpus_id: bestMatch.hit.id,
      corpus_page: bestMatch.hit.page,
      corpus_headword: bestMatch.hit.headword,
      corpus_pos: bestMatch.hit.pos,
      corpus_gloss: bestMatch.hit.gloss,
      creider_primary: c.form_primary,
      creider_secondary: c.form_secondary || '',
      creider_gloss: c.gloss,
      creider_pos: c.pos,
      creider_page: c.source_page,
      via_variant: bestMatch.variantForm,
      notes: c.notes || ''
    });
  } else {
    stillMissing.push({
      creider_primary: c.form_primary,
      creider_secondary: c.form_secondary || '',
      gloss: c.gloss,
      pos: c.pos,
      number: c.number || '',
      source_page: c.source_page,
      notes: c.notes || ''
    });
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

const recoveredHeaders = [
  'confidence','transform','gloss_overlap',
  'corpus_id','corpus_page','corpus_headword','corpus_pos','corpus_gloss',
  'creider_primary','creider_secondary','creider_gloss','creider_pos','creider_page',
  'via_variant','notes'
];

const stillMissingHeaders = [
  'creider_primary','creider_secondary','gloss','pos','number','source_page','notes'
];

// Sort recovered: HIGH first, then MEDIUM, then LOW
const confOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
recovered.sort((a, b) => {
  if (confOrder[a.confidence] !== confOrder[b.confidence]) {
    return confOrder[a.confidence] - confOrder[b.confidence];
  }
  return parseFloat(b.gloss_overlap) - parseFloat(a.gloss_overlap);
});

stillMissing.sort((a, b) => {
  if (a.pos !== b.pos) return a.pos.localeCompare(b.pos);
  return bare(a.creider_primary).localeCompare(bare(b.creider_primary));
});

const recoveredPath = writeCSV('creider-recovered-fuzzy.csv', recoveredHeaders, recovered);
const stillMissingPath = writeCSV('creider-still-missing.csv', stillMissingHeaders, stillMissing);

// --- report ----------------------------------------------------------------

const totalCreider = creider.length;
const alreadyMatched = totalCreider - recovered.length - stillMissing.length;

console.log('Creider entries total:     ' + totalCreider);
console.log('Matched in pass 1:         ' + alreadyMatched);
console.log('Recovered in pass 2:       ' + recovered.length);
console.log('Still missing after pass 2:' + stillMissing.length);
console.log('');

const byConf = { HIGH: 0, MEDIUM: 0, LOW: 0 };
for (const r of recovered) byConf[r.confidence]++;
console.log('Pass-2 recoveries by confidence:');
console.log('  HIGH (good gloss + strong transform):  ' + byConf.HIGH);
console.log('  MEDIUM (some gloss overlap):           ' + byConf.MEDIUM);
console.log('  LOW (form matches via transform only): ' + byConf.LOW);

console.log('');
console.log('Most-used transforms:');
const transformCounts = {};
for (const r of recovered) {
  transformCounts[r.transform] = (transformCounts[r.transform] || 0) + 1;
}
for (const [t, count] of Object.entries(transformCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log('  ' + t.padEnd(30) + count);
}

console.log('');
console.log('Wrote: ' + recoveredPath);
console.log('Wrote: ' + stillMissingPath);
