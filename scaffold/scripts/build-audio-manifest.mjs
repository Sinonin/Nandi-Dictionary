// Scans public/audio/ and emits public/audio-manifest.json
// Convention:
//   <entry_id>.<ext>           → primary recording
//   <entry_id>__v2.<ext>, v3…  → alternative takes
//
// Output schema:
//   { "<entry_id>": { "primary": "/audio/…", "variants": ["/audio/…", …] } }
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';

const AUDIO_DIR = join(process.cwd(), 'public', 'audio');
const OUT = join(process.cwd(), 'public', 'audio-manifest.json');
const ACCEPT = new Set(['.m4a', '.mp3', '.ogg', '.opus', '.wav', '.aac']);

const manifest = {};
if (existsSync(AUDIO_DIR)) {
  for (const f of readdirSync(AUDIO_DIR)) {
    const { name, ext } = parse(f);
    if (!ACCEPT.has(ext.toLowerCase())) continue;
    if (name.startsWith('_') || name.startsWith('.')) continue;

    const variantMatch = name.match(/^(.+?)__v\d+$/);
    const isVariant = !!variantMatch;
    const id = variantMatch ? variantMatch[1] : name;
    const url = `/audio/${f}`;

    if (!manifest[id]) manifest[id] = { primary: null, variants: [] };
    if (isVariant) manifest[id].variants.push(url);
    else manifest[id].primary = url;
  }
  for (const id of Object.keys(manifest)) manifest[id].variants.sort();
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2));
const primary = Object.values(manifest).filter((m) => m.primary).length;
const variants = Object.values(manifest).reduce((n, m) => n + m.variants.length, 0);
console.log(`audio-manifest.json: ${primary} primary + ${variants} variants`);
