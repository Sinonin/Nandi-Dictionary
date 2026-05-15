const fs = require('fs');
const path = require('path');

const candidatesPath = path.join(__dirname, '..', 'wotd-candidates.json');
const data = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const ids = data.entries.map(e => e.id);

const out = `// AUTO-GENERATED from wotd-candidates.json
// Curated pool for Ng'olyoo ne oo Rani (Word of the Day).
// Total entries: ${ids.length}
// Generated: ${new Date().toISOString()}

export const WOTD_POOL: string[] = [
${ids.map(id => '  "' + id + '",').join('\n')}
];
`;

const outPath = path.join(__dirname, '..', 'src', 'lib', 'wotd-pool.ts');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote ' + ids.length + ' entry IDs to src/lib/wotd-pool.ts (double-quoted)');
