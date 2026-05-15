# Heritage of the Nandi — Working Conventions

*Companion to the corpus and the booklet · v1.0 · 15 May 2026 · Matelong*

---

## Purpose

This document codifies the rules under which the *Heritage of the Nandi* corpus is maintained and the booklet is composed. It is the standing instruction for every session that touches the work — for the author, for collaborators, for any AI agent operating inside the project. When in doubt, consult this document. When the document is silent, ask before inventing.

---

## Source and authority

The corpus is grounded in the recollections of two named tradents:

- **Pot Tera Chebo Chebaigeei** — maternal grandmother. Primary source.
- **Chebo Koisamo** — mother. Daughter of Kimuikeei araap Surtan Kwombo Tera, Koitaleel's Maotioot of Kameliilo.

Both are named in every edition. Their authority is the floor. Contributor voices extend but never displace them.

---

## Canonical structure

Every entry in the corpus belongs to a three-level hierarchy:

**Clan → Sub-totem → Kapchi (house)**

The clan is the named collective — sixteen in total, from Kipkenda to Tungo. The sub-totem is the animal, bird, force, or being under which a group within the clan gathers; most clans carry one, some carry several (Mooi carries five). The Kapchi is the named house: a particular lineage that traces to a known forebear.

This three-level structure is non-negotiable. Flat lists of "clans and totems" without the houses are useful for headlines and pedagogy. They are not the corpus.

---

## Naming conventions

**Kapchi names take the form `KapXxx`** — Kap- prefix, capitalised root. Variant spellings are joined with a slash inside a single entry (e.g., `KapKogeluk/Maisz`, `KapCheboiywo/KapLaal`). Both variants are part of the entry; neither replaces the other.

**Parenthetical anchors** identify notable persons whose membership clarifies which Kapchi is meant — `KapMutwo (Prof David Serem)`, `KapChepkener (Hon Kosgey)`, `KapKungurei (the Late Bishop Muge)`. The test is *which Kapchi*, not *which celebrity*. Use sparingly.

**A small number of entries break the Kap- pattern** (e.g., `Mamaet`). These are recorded as known. Do not regularise.

---

## Sayings and epithets

Sayings stay in Nandi. The Nandi carries the weight; smoothing it into modern phrasing is a corruption. English glosses, where offered, are *bridges* for readers without the tongue — italicised, set apart, never replacing the original. The cadence reflects the grandmother who taught them.

Each clan may carry one, several, or no sayings. Where a clan carries none in the current edition, that is a **gap to be filled by contributors** — not a placeholder to be invented.

---

## Contributor attribution

Every new entry — whether a new Kapchi, a new saying, a new sub-totem, or a correction to an existing entry — must carry contributor attribution. Attributions are collected in the booklet's Contributors list. **No entry enters the corpus without a named source.**

If an entry's source is uncertain, it is held in a `pending/` namespace until verified. The canonical corpus is for verified material only.

---

## The Chemuri rule

Mooi is not a single house. It is a coalition of five sub-totems: **Kong'oony** (crested crane), **Kipkamoor** (warbler), **Soeen** (buffalo), **Kergeng'** (Cheptirgich), and **Koogos** (buzzard).

The Kergeng' sub-totem is the **Chemuri** — the witches and sorcerers of Nandi lore who, in the pre-Orkoiyot era, led the Nandi. They sheltered behind the most disarming totem in the catalogue: the crane that "brings babies," the Nandi equivalent of the European stork. Kong'oony is the public face; Kergeng' is the inner chamber.

**Kipamui clan also bears the name Kergeng'**, and its totem is the duiker (Cheptirkiich / Ptuui Seru). Kipamui stands alone, clean. The shared name across Mooi and Kipamui is symbolic and historical, not a duplication. This distinction is structural to the corpus and must be preserved in every edition.

The Talai (Orkoiyot) order displaced the Chemuri but did not erase them.

---

## The image rule

For printed editions: one totem image per clan plate. Images depict the totem in **natural habitat** — a bee on the comb, a crane in grass, an eagle in sky, an elephant on the savanna. Studio shots, pet-shop specimens, and over-stylised photographs break the visual grammar of the booklet and should be replaced when better images surface.

---

## Cross-clan name overlap

A name appearing in more than one clan or sub-totem is a **coincidence by default**. Different families share names across unrelated lineages, just as European Smiths and Müllers do.

Overlaps are recorded in `overlaps.txt` and acknowledged in the corpus via a `see_also` field only where the overlap is substantively meaningful — most notably: `KapChemwan` in Mooi/Kergeng' and Kipamui/Cheptirkiich, where the shared Kergeng' totem name makes the recurrence interpretively significant.

**Same-name entries within the same sub-totem are duplicates** to clean up, not coincidences.

---

## License and use

The booklet and the corpus are released **free for personal and academic use**. They are **not for sale**. This is a permanent rule.

Commercial republication, paywalled distribution, and repackaging without attribution are contrary to the project's purpose, which is to keep the inheritance.

Corrections and additions are welcomed in every edition. Attribution accompanies them.

---

## Typography and design

The booklet is set in three open-source typefaces:

- **EB Garamond** — body text. Renaissance serifs.
- **Cinzel** — display capitals. Roman inscriptional.
- **Playfair Display** — headings and titles.

Cream stock, gold-and-green palette, drop-cap chapter openings, image-facing-data spreads, and the small bee mark are the recurring signatures of the edition. They are not decoration — they are the booklet's visual identity.

---

## Versioning and commits

The corpus carries an edition number and a Roman numeral year — currently `Volume III · Edition 3.8 · MMXXVI`. Each substantive commit advances the patch number; each printed release advances the minor number; major restructures advance the volume number.

Git commit messages name the contributor where applicable:

```
Add KapXyz to Mooi/Kong'oony (attr: Salome Slettum)
Correct spelling KapTigoi → KapTiegoi in Kipkenda/Segemiat (attr: J. Kemboi)
Add saying "..." to Kap'o'iit (attr: Mwalimu Rop)
```

The commit log becomes a second contributor list.

---

## Register

The booklet's voice is **punchy, first-person where appropriate, magazine in register, serif in disposition**. No academic hedging. No corporate cadence. Sharp aphoristic closing lines. The English bridge passages are written in the same voice as the Nandi originals — direct, anchored, unembarrassed.

---

> *"What a grandmother remembers, a grandchild must write down. What a grandchild writes down, the people may yet keep."*

— **Cheison · Matelong · MMXXVI**
