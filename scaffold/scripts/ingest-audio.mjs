#!/usr/bin/env node
// Ingest recorded audio into public/audio/, mapping filenames → entry IDs.
//
// Usage:
//   node scripts/ingest-audio.mjs <source-dir>
//
// Filename tolerance: the script handles all of these as "ke":
//   ke.m4a, Ke.m4a, nandi_001_ke.m4a, 001_ke.m4a, 1-ke.m4a,
//   ke_v1.m4a, ke alt.m4a, ke (2).m4a, Recording_ke.m4a
//
// First match wins for the primary file at public/audio/<id>.<ext>.
// Subsequent matches become variants at public/audio/<id>__v2.<ext>, __v3, …
// Unmapped files are listed at the end so you can fix names and re-run.

import { readdirSync, copyFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, parse, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const ROOT = resolve(import.meta.dirname, '..');
const AUDIO_OUT = join(ROOT, 'public', 'audio');
const CORPUS_PATH = join(ROOT, 'public', 'corpus.json');
const PRIORITY_PATH = join(ROOT, 'audio_priority_list.csv');  // optional

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/ingest-audio.mjs <source-dir>');
  process.exit(1);
}
const SRC = resolve(src);
if (!existsSync(SRC)) {
  console.error(`Source dir not found: ${SRC}`);
  process.exit(1);
}

mkdirSync(AUDIO_OUT, { recursive: true });

// Build lookup tables ---------------------------------------------------------
const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));

// Normalise a key for matching: lowercase, strip apostrophes, strip hyphens
const norm = (s) => s.toLowerCase().replace(/['_\-\s]/g, '');

// headword (normalised) → entry_id  (first occurrence wins; ambiguity logged)
const headwordToId = new Map();
const ambiguous = new Map();   // norm_headword → [ids…]
for (const e of corpus) {
  const k = norm(e.headword);
  if (headwordToId.has(k)) {
    if (!ambiguous.has(k)) ambiguous.set(k, [headwordToId.get(k)]);
    ambiguous.get(k).push(e.id);
  } else {
    headwordToId.set(k, e.id);
  }
}

// Optional priority list — if a CSV exists at project root, use it as
// the *preferred* mapping for words with ambiguous headwords (e.g. "ke",
// which appears in many compounds — the priority list pins the canonical id).
const priorityMap = new Map();
if (existsSync(PRIORITY_PATH)) {
  const lines = readFileSync(PRIORITY_PATH, 'utf8').split('\n').slice(1);
  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length < 4) continue;
    const word = cols[1]?.trim();
    const id = cols[3]?.trim();
    if (word && id) priorityMap.set(norm(word), id);
  }
}

// Extract a candidate Nandi word from a filename
function extractWord(filename) {
  let s = parse(filename).name;       // strip extension
  s = s.replace(/^nandi[_\-\s]*/i, '');        // strip "nandi_" prefix
  s = s.replace(/^\d+[_\-\s\.]+/, '');         // strip leading rank digits
  s = s.replace(/^recording[_\-\s]*/i, '');    // strip "recording" prefix
  s = s.replace(/[\s_\-]*(v\d+|alt|alternate|\(\d+\)|copy|\d+)$/i, ''); // strip variant suffix
  s = s.trim();
  return s;
}

// Resolve a filename to an entry_id, tracing the decision
function resolveEntryId(filename) {
  const word = extractWord(filename);
  const k = norm(word);
  // 1. priority list (most authoritative)
  if (priorityMap.has(k)) return { id: priorityMap.get(k), via: 'priority', word };
  // 2. exact headword (after norm)
  if (headwordToId.has(k)) {
    return {
      id: headwordToId.get(k),
      via: ambiguous.has(k) ? `headword (AMBIGUOUS: ${ambiguous.get(k).join(', ')})` : 'headword',
      word,
    };
  }
  // 3. headword with ke- prefix tried for verb stems
  if (headwordToId.has('ke' + k)) return { id: headwordToId.get('ke' + k), via: 'ke-prefix', word };
  // 4. headword starts-with (last resort for "kogo" → "kogoit")
  for (const [hk, id] of headwordToId) {
    if (hk.startsWith(k) && hk.length - k.length <= 3) {
      return { id, via: `prefix-match (${hk})`, word };
    }
  }
  return { id: null, via: 'unmatched', word };
}

// Ingest ----------------------------------------------------------------------
const AUDIO_EXTS = new Set(['.m4a', '.mp3', '.ogg', '.opus', '.wav', '.aac']);
const files = readdirSync(SRC)
  .filter((f) => AUDIO_EXTS.has(parse(f).ext.toLowerCase()))
  .sort();

console.log(`\nScanning ${files.length} audio files in ${SRC}\n`);

const taken = new Set();           // entry_ids already given a primary
const variantCount = new Map();    // entry_id → next variant index
const report = { mapped: [], variants: [], unmatched: [] };

for (const f of files) {
  const { id, via, word } = resolveEntryId(f);
  const ext = parse(f).ext.toLowerCase();
  if (!id) {
    report.unmatched.push({ file: f, extracted: word });
    continue;
  }
  let outName, kind;
  if (!taken.has(id)) {
    outName = `${id}${ext}`;
    taken.add(id);
    kind = 'primary';
  } else {
    const n = (variantCount.get(id) || 1) + 1;
    variantCount.set(id, n);
    outName = `${id}__v${n}${ext}`;
    kind = `variant v${n}`;
  }
  copyFileSync(join(SRC, f), join(AUDIO_OUT, outName));
  (kind === 'primary' ? report.mapped : report.variants).push({ file: f, id, via, kind });
}

// Report ----------------------------------------------------------------------
console.log(`✓ Mapped:    ${report.mapped.length} primary recordings`);
console.log(`+ Variants:  ${report.variants.length} additional takes`);
console.log(`✗ Unmatched: ${report.unmatched.length} files\n`);

if (report.mapped.length) {
  console.log('--- Mapped ---');
  for (const m of report.mapped) console.log(`  ${m.file}  →  ${m.id}  [${m.via}]`);
}
if (report.variants.length) {
  console.log('\n--- Variants ---');
  for (const m of report.variants) console.log(`  ${m.file}  →  ${m.id}  [${m.kind}]`);
}
if (report.unmatched.length) {
  console.log('\n--- Unmatched (rename and re-run) ---');
  for (const m of report.unmatched) console.log(`  ${m.file}  (extracted: "${m.extracted}")`);
}

// Save a JSON report alongside the audio so we have an audit trail
writeFileSync(
  join(AUDIO_OUT, '_ingest_report.json'),
  JSON.stringify({ ...report, source: SRC, when: new Date().toISOString() }, null, 2),
);
console.log(`\nReport: public/audio/_ingest_report.json`);
console.log(`Next:   npm run build:audio-manifest && npm run dev\n`);
