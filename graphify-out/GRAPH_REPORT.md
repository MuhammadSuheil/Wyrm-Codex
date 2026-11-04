# Graph Report - Wyrm Codex  (2026-11-04)

## Corpus Check
- Corpus is ~26,730 words - fits in a single context window. You may not need a graph.

## Summary
- 381 nodes · 998 edges · 28 communities (18 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Codex Browsing and Filters
- Character Builder and PDF
- Vite and Figma Tooling
- Landing Page and Cards
- Routing and API Data
- TypeScript Compiler Settings
- Character Sheet Form
- Markdown and Dice Rolls
- HTML Application Shell
- Knight Class Artwork
- Elven Species Artwork
- Spellcasting Card Artwork
- Misty Mountain Artwork
- Dungeon Realm Artwork
- Heroes Realm Artwork
- Tome Valley Artwork
- Application Favicon
- Torchlit Hall Artwork
- Dungeons and Dragons Branding
- Velvet Background Texture

## God Nodes (most connected - your core abstractions)
1. `CharacterSheet()` - 32 edges
2. `MagicItems()` - 27 edges
3. `useResource()` - 25 edges
4. `Feats()` - 24 edges
5. `PageHeader()` - 24 edges
6. `ErrorNote()` - 24 edges
7. `Spells()` - 23 edges
8. `go()` - 22 edges
9. `react` - 21 edges
10. `Monsters()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `CharacterSheet()`  [EXTRACTED]
  src/App.tsx → src/codex/CharacterSheet.tsx
- `App()` --calls--> `Classes()`  [EXTRACTED]
  src/App.tsx → src/codex/Classes.tsx
- `App()` --calls--> `MagicItems()`  [EXTRACTED]
  src/App.tsx → src/codex/MagicItems.tsx
- `App()` --calls--> `Monsters()`  [EXTRACTED]
  src/App.tsx → src/codex/Monsters.tsx
- `App()` --calls--> `Backgrounds()`  [EXTRACTED]
  src/App.tsx → src/codex/Small.tsx

## Import Cycles
- None detected.

## Communities (28 total, 10 thin omitted)

### Community 0 - "Codex Browsing and Filters"
Cohesion: 0.09
Nodes (82): cap(), Page, qs(), useDebounced(), useInfinite(), useResource(), ClassEmblem(), glyphs (+74 more)

### Community 1 - "Character Builder and PDF"
Cohesion: 0.08
Nodes (51): ABIL, ALIGN, Area(), blank(), Box(), CharacterSheet(), Dot(), F() (+43 more)

### Community 2 - "Vite and Figma Tooling"
Cohesion: 0.05
Nodes (38): dependencies, pdf-lib@^1.17.1, react@^19.0.0, react-dom@^19.0.0, devDependencies, oxfmt@^0.2.0, tailwindcss@^4.0.0, @tailwindcss/vite@^4.0.0 (+30 more)

### Community 3 - "Landing Page and Cards"
Cohesion: 0.08
Nodes (38): react, Bookmark(), P, go(), classes, Klass, Glossary(), TABS (+30 more)

### Community 4 - "Routing and API Data"
Cohesion: 0.11
Nodes (34): API, cache, fmt(), get(), loadStats(), Stats, useStats(), App() (+26 more)

### Community 5 - "TypeScript Compiler Settings"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+10 more)

### Community 6 - "Character Sheet Form"
Cohesion: 0.21
Nodes (12): Six ability scores and modifiers, Attacks and spellcasting entries, Character identity and progression, Appearance, backstory, allies and treasure, Combat statistics and death saves, Equipment, coins and proficiencies, D&D fifth edition fillable character sheet, Personality traits, ideals, bonds and flaws (+4 more)

### Community 7 - "Markdown and Dice Rolls"
Cohesion: 0.43
Nodes (6): Roll, roll(), rollable(), rollExpr(), inline(), txt()

### Community 8 - "HTML Application Shell"
Cohesion: 0.50
Nodes (4): Figma HTML injection placeholders, Vite HTML application shell, Main TypeScript module entry, Root DOM mount element

### Community 9 - "Knight Class Artwork"
Cohesion: 0.50
Nodes (4): Armored knight, Classes card artwork, Compass star ornament, Knight longsword

### Community 10 - "Elven Species Artwork"
Cohesion: 0.50
Nodes (4): Elven Ceremonial Figure, Flaming Staff and Book, Races Card Illustration, Sun Motifs

### Community 11 - "Spellcasting Card Artwork"
Cohesion: 0.50
Nodes (4): Luminous arcane sigil, Spells card artwork, Crescent moon and star motifs, Spellcasting hands

### Community 12 - "Misty Mountain Artwork"
Cohesion: 0.50
Nodes (4): Forested mountain ridges, Hilltop church, Low clouds and mist, Misty mountain landscape

### Community 13 - "Dungeon Realm Artwork"
Cohesion: 0.50
Nodes (4): Dungeon realm artwork, Fractured rock chasm, Lone explorer, Winged creatures

### Community 14 - "Heroes Realm Artwork"
Cohesion: 0.50
Nodes (4): Adventuring party, Towering armored figure, Heroic confrontation artwork, Misty forest and stone ruins

### Community 15 - "Tome Valley Artwork"
Cohesion: 0.50
Nodes (4): Alpine valley artwork, Green meadows and woodland, Winding river and foreground stream, Snow-capped mountain range

### Community 16 - "Application Favicon"
Cohesion: 0.67
Nodes (3): Application favicon, White four-arm orbit symbol, Dark rounded-square background

### Community 17 - "Torchlit Hall Artwork"
Cohesion: 0.67
Nodes (3): Ancient stone hall artwork, Stone columns and carved walls, Wall mounted fire braziers

## Knowledge Gaps
- **37 isolated node(s):** `Root DOM mount element`, `Main TypeScript module entry`, `Figma HTML injection placeholders`, `Character identity and progression`, `Combat statistics and death saves` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Landing Page and Cards` to `Codex Browsing and Filters`, `Character Builder and PDF`, `Vite and Figma Tooling`, `Routing and API Data`, `Markdown and Dice Rolls`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `CharacterSheet()` (e.g. with `load()` and `modOf()`) actually correct?**
  _`CharacterSheet()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Root DOM mount element`, `Main TypeScript module entry`, `Figma HTML injection placeholders` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Codex Browsing and Filters` be split into smaller, more focused modules?**
  _Cohesion score 0.0933832709113608 - nodes in this community are weakly interconnected._
- **Why does `CharacterSheet()` connect `Character Builder and PDF` to `Codex Browsing and Filters`, `Vite and Figma Tooling`, `Routing and API Data`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `Character Builder and PDF` be split into smaller, more focused modules?**
  _Cohesion score 0.08013468013468013 - nodes in this community are weakly interconnected._
- **Should `Vite and Figma Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05019607843137255 - nodes in this community are weakly interconnected._

Audit note: Semantic extraction ran in host subagents without a metered external API. The collaboration tool did not expose token usage; zero token counters are placeholders, not measured zero usage.

Graph health: WARNING: 2 dangling_endpoint_edges; 2 self_loop_edges; 2 directed_same_endpoint_collapsed_edges; 2 undirected_same_endpoint_collapsed_edges. See health.json for details.
