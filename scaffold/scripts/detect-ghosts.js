const fs = require('fs');
const path = require('path');

const CORPUS_PATH = path.join(__dirname, '..', 'public', 'corpus.json');
const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));

const POS = ['v','n','a','adj','adv','prep','conj','pron','num','interj','part','aux'];
const ghostRawRx = new RegExp(
  "^[a-z\u00F1'\\-]+(?:\\s+[a-z\u00F1'\\-]+)*(?:\\s*\\([^)]+\\))?(?:\\s+[a-z\u00F1'\\-]+)*\\s*(?:" + POS.join('|') + ")(?:\\.[a-z.]*)?\\.\\s*$",
  "i"
);
const englishGlossInNandiRx = /^to [a-z]/i;
const runOnRx = /;\s+[a-z].*?\.\s+[A-Z]/;

let affected = 0, totalGhosts = 0;
const flagged = [];
const reasonCounts = { 'raw-pos': 0, 'nandi-gloss': 0, 'english-runon': 0 };
const exCountHist = {};

for (const e of corpus) {
  const exs = e.examples || [];
  exCountHist[exs.length] = (exCountHist[exs.length] || 0) + 1;
  let ghosts = 0;
  const reasons = new Set();
  for (const ex of exs) {
    let g = false;
    if (ex.raw && ghostRawRx.test(ex.raw.trim())) { reasons.add('raw-pos'); reasonCounts['raw-pos']++; g = true; }
    if (ex.nandi && englishGlossInNandiRx.test(ex.nandi.trim())) { reasons.add('nandi-gloss'); reasonCounts['nandi-gloss']++; g = true; }
    if (ex.english && runOnRx.test(ex.english)) { reasons.add('english-runon'); reasonCounts['english-runon']++; g = true; }
    if (g) ghosts++;
  }
  if (ghosts > 0) {
    affected++;
    totalGhosts += ghosts;
    flagged.push({ id: e.id, headword: e.headword, page: e.page, ghosts, totalExs: exs.length, reasons: [...reasons].join(',') });
  }
}

flagged.sort((a, b) => b.ghosts - a.ghosts);

console.log('==============================================================');
console.log('  Nandi Dictionary -- Ghost-Example Detection Report');
console.log('==============================================================');
console.log('Total entries:                       ', corpus.length);
console.log('Entries with >=1 ghost example row:  ', affected, '(' + (100 * affected / corpus.length).toFixed(1) + '%)');
console.log('Total ghost rows across all entries: ', totalGhosts);
console.log('');
console.log('Reason breakdown:');
Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).forEach(([r, c]) => console.log('  ' + r.padEnd(20) + c));
console.log('');
console.log('Example-count distribution:');
Object.entries(exCountHist).sort((a, b) => +a[0] - +b[0]).forEach(([k, v]) => { if (+k > 0) console.log('  ' + String(k).padStart(3) + ' examples -> ' + v + ' entries'); });
console.log('');
console.log('Worst 25 offenders:');
console.log('  ' + 'ID'.padEnd(38) + 'headword'.padEnd(22) + 'page'.padEnd(8) + 'ghosts/total  reasons');
flagged.slice(0, 25).forEach(f => {
  console.log('  ' + f.id.padEnd(38) + f.headword.padEnd(22) + ('p.' + f.page).padEnd(8) + (f.ghosts + '/' + f.totalExs).padEnd(14) + f.reasons);
});
