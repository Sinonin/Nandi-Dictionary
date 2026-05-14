// Tone- and diacritic-insensitive normalisation for Nandi search.
// People won't type ä/ö/ü or accents on phones. Strip everything,
// keep ng' as ng (apostrophe optional), preserve hyphens for affix matching.

const ATR_MAP: Record<string, string> = {
  ä: 'a', Ä: 'a', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
};

export function normalize(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')                  // strip combining marks
    .replace(/[äöüÄÖÜ]/g, (m) => ATR_MAP[m] || m)
    .replace(/'/g, '')                                 // ng' → ng
    .replace(/_/g, '')                                 // tone markers in phon
    .replace(/:/g, '')                                 // length markers
    .replace(/[^a-z\- ]/g, '')                         // keep letters, hyphen, space
    .trim();
}

// Loose normalisation for fuzzy match — also strips hyphens
export function looseNormalize(s: string): string {
  return normalize(s).replace(/-/g, '');
}
