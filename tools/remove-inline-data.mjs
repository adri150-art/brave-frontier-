// Supprime les copies inline des constantes data (fournies par globals.bundle.js)
import { readFileSync, writeFileSync } from 'fs';
const FILE = new URL('../index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const NAMES = ['ITEM_RARITIES','ITEM_SLOTS','ITEM_SLOT_NAMES','ITEM_SLOT_ICONS','AFFIX_TABLE','SPHERE_DEFS','MATERIAL_DEFS','EVO_LEVEL_CAPS','EVO_COSTS','EVO_ZONE_GATES','ELEMENT_ADVANTAGE','MILESTONES','MILESTONE_LABELS','HERO_TYPES','TYPE_MODS','SUMMON_POOLS','ZONE_THEMES','TIER_PREFIXES','BIOME_BGS','BIOME_GLOW_COLORS','ELEM_BADGE_COLOR','ELEM_ICONS','ELEM_COLORS','HERO_DEFS','ACHIEVEMENTS_DEFS','LOGIN_REWARDS','DQ_POOL','WEEKLY_BOSSES','OBJECTIVES','MONSTER_IMAGES','SKILL_TREE_DEF','PARAGON_CATEGORIES','FORMATIONS','SYNERGIES'];

function findSpan(name) {
  const re = new RegExp(`const ${name} *=`);
  const m = re.exec(html);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 0, inStr = null, esc = false;
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
  return [m.index, i + 1]; // inclut le ';'
}

let removed = 0;
for (const name of NAMES) {
  const span = findSpan(name);
  if (!span) { console.log(`❓ ${name} introuvable — ignoré`); continue; }
  const lines = html.slice(span[0], span[1]).split('\n').length;
  html = html.slice(0, span[0]) +
    `/* §câblage : ${name} fourni par assets/globals.bundle.js (src/data) */` +
    html.slice(span[1]);
  removed++;
  console.log(`✂️  ${name} (${lines} lignes)`);
}
writeFileSync(FILE, html);
console.log(`\n${removed}/34 copies inline supprimées · index.html → ${html.split('\n').length} lignes`);
