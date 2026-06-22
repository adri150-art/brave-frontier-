// Compare les constantes inline de index.html aux exports src/data — §câblage
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

// Extraction d'une expression équilibrée après "const NAME ="
function extractDecl(name) {
  const re = new RegExp(`const ${name} *=`);
  const m = re.exec(html);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 0, inStr = null, esc = false;
  const start = i;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '/' && html[i+1] === '/') { i = html.indexOf('\n', i); continue; }
    if (c === '/' && html[i+1] === '*') { i = html.indexOf('*/', i) + 1; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ';' && depth === 0) break;
  }
  return html.slice(start, i).trim();
}

// Sérialisation tolérante (fonctions → source normalisée)
function norm(v) {
  return JSON.stringify(v, (k, val) =>
    typeof val === 'function' ? 'ƒ:' + String(val).replace(/\s+/g, ' ') : val);
}

const MAP = {
  'data/affixes.js':  ['ITEM_RARITIES','ITEM_SLOTS','ITEM_SLOT_NAMES','ITEM_SLOT_ICONS','AFFIX_TABLE','SPHERE_DEFS','MATERIAL_DEFS'],
  'data/balance.js':  ['EVO_LEVEL_CAPS','EVO_COSTS','EVO_ZONE_GATES','ELEMENT_ADVANTAGE','MILESTONES','MILESTONE_LABELS','HERO_TYPES','TYPE_MODS'],
  'data/banners.js':  ['SUMMON_POOLS'],
  'data/biomes.js':   ['ZONE_THEMES','TIER_PREFIXES','BIOME_BGS','BIOME_GLOW_COLORS','ELEM_BADGE_COLOR','ELEM_ICONS','ELEM_COLORS'],
  'data/heroes.js':   ['HERO_DEFS'],
  'data/liveops.js':  ['ACHIEVEMENTS_DEFS','LOGIN_REWARDS','DQ_POOL','WEEKLY_BOSSES','OBJECTIVES'],
  'data/monsters.js': ['MONSTER_IMAGES'],
  'data/skilltree.js':['SKILL_TREE_DEF','PARAGON_CATEGORIES'],
  'data/squad.js':    ['FORMATIONS','SYNERGIES'],
};

let same = 0, diff = 0, missing = 0;
for (const [mod, names] of Object.entries(MAP)) {
  const m = await import(join(root, 'src', mod));
  for (const name of names) {
    const src = extractDecl(name);
    if (src === null) { console.log(`❓ ${name} : introuvable inline`); missing++; continue; }
    let inlineVal;
    try { inlineVal = (0, eval)(`(${src})`); }
    catch (e) { console.log(`⚠️ ${name} : eval inline échoue — ${e.message}`); diff++; continue; }
    if (!(name in m)) { console.log(`❓ ${name} : absent du module ${mod}`); missing++; continue; }
    if (norm(inlineVal) === norm(m[name])) { same++; }
    else { console.log(`❌ ${name} : DIVERGE (inline ≠ ${mod})`); diff++; }
  }
}
console.log(`\nIdentiques: ${same}   Divergents: ${diff}   Manquants: ${missing}`);
process.exit(diff + missing ? 1 : 0);
