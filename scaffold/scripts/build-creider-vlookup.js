#!/usr/bin/env node
// build-creider-vlookup.js
// Combines creider-marks-suggested.csv and (optionally)
// creider-recovered-fuzzy.csv into a single reference CSV with corpus_id as
// column A, suitable for VLOOKUP from the main corpus-audit.csv sheet.
//
// Usage (from scripts/ directory):
//   node build-creider-vlookup.js
//
// Output: creider-vlookup.csv in scaffold root.

const fs = require('fs');
const path = require('path');

// --- minimal CSV parser ---------------------------------------------------

function parseRow(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === ',') { result.push(cur); cur = ''; }
      else if (ch === '"') inQuotes = true;
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j] || '';
    rows.push(row);
  }
  return rows;
}

function csv(s) {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

// --- load both input CSVs -------------------------------------------------

const baseDir = path.join(__dirname, '..');
const suggestedPath = path.join(baseDir, 'creider-marks-suggested.csv');
const recoveredPath = path.join(baseDir, 'creider-recovered-fuzzy.csv');

const combined = [];

if (fs.existsSync(suggestedPath)) {
  const rows = parseCSV(fs.readFileSync(suggestedPath, 'utf8'));
  for (const r of rows) {
    combined.push({
      corpus_id: r.corpus_id,
      confidence: r.confidence,
      source: 'direct match',
      creider_primary: r.creider_primary,
      creider_secondary: r.creider_secondary,
      creider_gloss: r.creider_gloss,
      gloss_overlap: r.gloss_overlap,
      notes: r.notes
    });
  }
  console.log('Loaded ' + rows.length + ' rows from creider-marks-suggested.csv');
} else {
  console.log('No creider-marks-suggested.csv found (run compare-with-creider.js first).');
}

if (fs.existsSync(recoveredPath)) {
  const rows = parseCSV(fs.readFileSync(recoveredPath, 'utf8'));
  for (const r of rows) {
    combined.push({
      corpus_id: r.corpus_id,
      confidence: r.confidence,
      source: 'fuzzy: ' + r.transform,
      creider_primary: r.creider_primary,
      creider_secondary: r.creider_secondary,
      creider_gloss: r.creider_gloss,
      gloss_overlap: r.gloss_overlap,
      notes: r.notes
    });
  }
  console.log('Loaded ' + rows.length + ' rows from creider-recovered-fuzzy.csv');
} else {
  console.log('No creider-recovered-fuzzy.csv yet — run recover-fuzzy-matches.js if you want it included.');
}

// --- deduplicate ----------------------------------------------------------

// If a corpus_id appears in both files (direct match AND fuzzy), prefer the
// direct match (it's the stronger signal).
const byId = new Map();
for (const row of combined) {
  if (!byId.has(row.corpus_id)) {
    byId.set(row.corpus_id, row);
  } else {
    const existing = byId.get(row.corpus_id);
    // Prefer direct match over fuzzy
    if (existing.source !== 'direct match' && row.source === 'direct match') {
      byId.set(row.corpus_id, row);
    }
    // Within same source, prefer higher confidence
    else if (existing.source === row.source) {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (order[row.confidence] < order[existing.confidence]) {
        byId.set(row.corpus_id, row);
      }
    }
  }
}

const final = Array.from(byId.values());
final.sort((a, b) => a.corpus_id.localeCompare(b.corpus_id));

// --- write ----------------------------------------------------------------

const headers = ['corpus_id','confidence','source','creider_primary','creider_secondary','creider_gloss','gloss_overlap','notes'];
const lines = [headers.map(csv).join(',')];
for (const row of final) lines.push(headers.map(h => csv(row[h])).join(','));

const outPath = path.join(baseDir, 'creider-vlookup.csv');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log('');
console.log('Wrote ' + final.length + ' rows to ' + outPath);
console.log('Columns (in order, for VLOOKUP):');
headers.forEach((h, i) => console.log('  ' + String.fromCharCode(65 + i) + ': ' + h));
