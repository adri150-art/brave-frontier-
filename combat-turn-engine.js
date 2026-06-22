/* ============================================================================
 *  PHASE 1 — MOTEUR DE COMBAT TOUR PAR TOUR « Encaisser & Répliquer »
 *  LOGIQUE PURE — aucune dépendance au DOM, aucune UI. Testable sous Node.
 *
 *  Déroulé d'un tour (conforme au concept) :
 *    1. ANNONCE  : le monstre désigne le héros qu'il frappera ce tour (telegraph).
 *    2. HÉROS    : le joueur choisit pour chaque héros ATT (attaque) ou DEF (Garde) ;
 *                  le Brave Burst se déclenche en "touchant" le héros (useBraveBurst).
 *    3. MONSTRE  : le monstre frappe le héros annoncé ; les dégâts sur la jauge
 *                  COMMUNE dépendent de l'ÉLÉMENT (réfraction) et de la DEF du héros
 *                  ciblé, et de sa Garde éventuelle.
 *    4. FIN      : +10 points de Brave Burst par héros, puis tour suivant.
 *
 *  Ce fichier ne touche à rien d'autre dans le jeu. Il sera branché plus tard.
 * ========================================================================== */

/* ---- Roue élémentaire (cohérente avec le jeu existant) -------------------
 * A "bat" B :  fire>earth>thunder>water>fire  ;  light<->dark
 * "earth" tient le rôle de "Plante" dans le concept (Lance = Plante).
 * ------------------------------------------------------------------------ */
const BEATS = { fire: 'earth', earth: 'thunder', thunder: 'water', water: 'fire', light: 'dark', dark: 'light' };

// Réglages d'équilibrage (faciles à modifier).
const TUNING = {
  REFRACTION_WEAK: 2.0,    // héros ciblé en faiblesse -> "prend très cher"
  REFRACTION_RESIST: 0.25, // héros ciblé en résistance -> "presque rien"
  GUARD_MULT: 0.5,         // DEF (Garde) : -50% de dégâts sur la jauge commune
  BB_MAX: 100,
  BB_PER_TURN: 10,         // génération passive par héros à la fin du tour
  BB_POWER: 3,             // multiplicateur de dégâts du Brave Burst
};

// Réactions de synergie : enchaîner les éléments des héros qui ATTAQUENT.
const SYNERGY_RECIPES = [
  { name: 'Floraison',     seq: ['water', 'earth'],   bonus: 10 }, // Eau -> Plante
  { name: 'Vaporisation',  seq: ['water', 'fire'],    bonus: 5  }, // Eau -> Feu
  { name: 'Surcharge',     seq: ['light', 'earth'],   bonus: 8  }, // Lumière -> Plante
  { name: 'Court-circuit', seq: ['thunder', 'water'], bonus: 8  }, // Foudre -> Eau
];

/** Multiplicateur subi par le héros ciblé (élément attaquant -> élément défenseur). */
function refraction(attackerElem, defenderElem) {
  if (BEATS[attackerElem] === defenderElem) return TUNING.REFRACTION_WEAK;
  if (BEATS[defenderElem] === attackerElem) return TUNING.REFRACTION_RESIST;
  return 1.0;
}

const PHASE = Object.freeze({ ANNOUNCE: 'ANNONCE', HERO: 'HEROS', MONSTER: 'MONSTRE', VICTORY: 'VICTOIRE', DEFEAT: 'DEFAITE' });

class TurnCombat {
  /**
   * @param {object} config { team:{maxHp}, heroes:[{id,name,element,atk,def,bbMax?}], monster:{name,element,hp,atk,def?} }
   * @param {object} [opts] { rng, onEvent }
   */
  constructor(config, opts = {}) {
    const c = JSON.parse(JSON.stringify(config));
    this.team = { hp: c.team.maxHp, maxHp: c.team.maxHp };
    this.monster = Object.assign({ def: 0 }, c.monster);
    this.monster.maxHp = this.monster.hp;
    this.heroes = c.heroes.map((h, i) => ({
      id: h.id, name: h.name, element: h.element,
      atk: h.atk, def: h.def, slot: i,
      img: h.img || null,   // illustration squad transmise par le hub
      bbGauge: 0, bbMax: h.bbMax || TUNING.BB_MAX,
      action: null,   // 'ATT' | 'DEF'
      taunt: !!h.taunt,
    }));

    this.turn = 0;
    this.phase = null;
    this.targetId = null;          // héros annoncé pour l'attaque du monstre
    this._atkOrder = [];           // ordre des éléments ayant attaqué ce tour (synergie)
    this.rng = opts.rng || Math.random;
    this.onEvent = opts.onEvent || (() => {});
    this.log = [];

    this.startTurn();
  }

  emit(type, data) {
    const ev = Object.assign({ type, turn: this.turn, phase: this.phase }, data);
    this.log.push(ev); this.onEvent(ev); return ev;
  }

  hero(id) { return this.heroes.find(h => h.id === id); }
  aliveHeroes() { return this.heroes; } // jauge commune : tous "présents" tant que l'équipe vit

  /* ---- 1. ANNONCE -------------------------------------------------------- */
  startTurn() {
    this.turn += 1;
    this.phase = PHASE.ANNOUNCE;
    this._atkOrder = [];
    this.heroes.forEach(h => { h.action = null; });

    // Cible : provocation prioritaire, sinon aléatoire.
    const taunter = this.heroes.find(h => h.taunt);
    this.targetId = taunter ? taunter.id : this.heroes[Math.floor(this.rng() * this.heroes.length)].id;

    const t = this.hero(this.targetId);
    const mult = refraction(this.monster.element, t.element);
    const tag = mult >= TUNING.REFRACTION_WEAK ? 'VULNÉRABLE' : mult <= TUNING.REFRACTION_RESIST ? 'résiste' : 'neutre';
    this.emit('ANNONCE', { targetId: t.id, targetName: t.name, monsterElement: this.monster.element, matchup: tag, refraction: mult });

    this.phase = PHASE.HERO;
    return this;
  }

  /* ---- 2. TOUR DES HÉROS ------------------------------------------------- */
  setAction(heroId, action) {
    this._assert(PHASE.HERO);
    if (action !== 'ATT' && action !== 'DEF') throw new Error('action invalide: ' + action);
    const h = this.hero(heroId); if (!h) throw new Error('héros inconnu: ' + heroId);
    h.action = action;
    this.emit('CHOIX', { heroId, name: h.name, action });
    return this;
  }

  /** "Toucher le portrait" = lancer le Brave Burst (nécessite la jauge pleine). */
  useBraveBurst(heroId) {
    this._assert(PHASE.HERO);
    const h = this.hero(heroId); if (!h) throw new Error('héros inconnu: ' + heroId);
    if (h.bbGauge < h.bbMax) { this.emit('BB_REFUS', { heroId, name: h.name, bbGauge: h.bbGauge }); return false; }
    const dmg = Math.max(0, Math.round(h.atk * TUNING.BB_POWER - this.monster.def));
    this.monster.hp = Math.max(0, this.monster.hp - dmg);
    h.bbGauge = 0;
    this._registerAttackElement(h);
    this.emit('BRAVE_BURST', { heroId, name: h.name, dmg, monsterHp: this.monster.hp });
    this._checkMonster();
    return true;
  }

  /** Résout le tour des héros : les ATT frappent, les DEF se mettent en Garde. */
  resolveHeroPhase() {
    this._assert(PHASE.HERO);
    this.heroes.forEach(h => {
      if (h.action === 'ATT') {
        const dmg = Math.max(0, Math.round(h.atk - this.monster.def));
        this.monster.hp = Math.max(0, this.monster.hp - dmg);
        this._registerAttackElement(h);
        this.emit('ATTAQUE_HERO', { heroId: h.id, name: h.name, dmg, monsterHp: this.monster.hp });
      } else if (h.action === 'DEF') {
        this.emit('GARDE', { heroId: h.id, name: h.name });
      }
      // action null = le héros ne fait rien ce tour (ni ATT ni DEF)
    });
    if (this._checkMonster()) return this;
    this.phase = PHASE.MONSTER;
    return this;
  }

  _registerAttackElement(h) {
    this._atkOrder.push(h.element);
    if (this._atkOrder.length >= 2) {
      const [a, b] = this._atkOrder.slice(-2);
      const recipe = SYNERGY_RECIPES.find(r => r.seq[0] === a && r.seq[1] === b);
      if (recipe) {
        // +bonus aux deux derniers héros impliqués (ceux dont l'élément forme la réaction)
        const involved = this.heroes.filter(x => x.element === a || x.element === b);
        involved.forEach(x => { x.bbGauge = Math.min(x.bbMax, x.bbGauge + recipe.bonus); });
        this.emit('SYNERGIE', { name: recipe.name, bonus: recipe.bonus, sequence: recipe.seq });
      }
    }
  }

  /* ---- 3. TOUR DU MONSTRE ------------------------------------------------ */
  resolveMonsterPhase() {
    this._assert(PHASE.MONSTER);
    const t = this.hero(this.targetId);
    const raw = this.monster.atk;
    const mult = refraction(this.monster.element, t.element);
    let dmg = raw * mult;
    const guarded = t.action === 'DEF';
    if (guarded) dmg *= TUNING.GUARD_MULT;
    dmg = Math.max(0, Math.round(dmg - t.def));
    this.team.hp = Math.max(0, this.team.hp - dmg);
    this.emit('ATTAQUE_MONSTRE', {
      targetId: t.id, targetName: t.name, raw, refraction: mult, guarded,
      finalDmg: dmg, teamHp: this.team.hp,
    });

    if (this.team.hp <= 0) { this.phase = PHASE.DEFEAT; this.emit('DEFAITE', {}); return this; }
    this.endTurn();
    return this;
  }

  /* ---- 4. FIN DE TOUR ---------------------------------------------------- */
  endTurn() {
    this.heroes.forEach(h => { h.bbGauge = Math.min(h.bbMax, h.bbGauge + TUNING.BB_PER_TURN); });
    this.emit('FIN_TOUR', { turn: this.turn });
    if (this.phase !== PHASE.VICTORY && this.phase !== PHASE.DEFEAT) this.startTurn();
    return this;
  }

  _checkMonster() {
    if (this.monster.hp <= 0) { this.phase = PHASE.VICTORY; this.emit('VICTOIRE', {}); return true; }
    return false;
  }

  _assert(p) { if (this.phase !== p) throw new Error(`Action hors phase ${p} (phase actuelle: ${this.phase})`); }

  status() {
    return {
      turn: this.turn, phase: this.phase, targetId: this.targetId,
      teamHp: this.team.hp, teamMaxHp: this.team.maxHp,
      monster: { name: this.monster.name, element: this.monster.element, hp: this.monster.hp, maxHp: this.monster.maxHp },
      heroes: this.heroes.map(h => ({ id: h.id, name: h.name, element: h.element, bbGauge: h.bbGauge, action: h.action })),
    };
  }
}

/* ---- Exports (Node + navigateur) ---------------------------------------- */
const API = { TurnCombat, refraction, PHASE, TUNING, SYNERGY_RECIPES, BEATS };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.TurnCombatEngine = API;
