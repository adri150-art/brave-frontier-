import { _Dec, D, fmt } from '../src/core/bignum.js';
import { HERO_DEFS } from '../src/data/heroes.js';
import { on, off, emit } from '../src/core/events.js';
import { createRng } from '../src/core/rng.js';
let pass=0, fail=0; const fails=[];
const ok=(c,l)=>{c?pass++:(fail++,fails.push(l));};
const close=(a,b,r=1e-9)=>a===b||(b===0?Math.abs(a)<1e-9:Math.abs(a-b)/Math.abs(b)<r);

// ---- bignum (module) ----
for(let i=0;i<30000;i++){
  const a=(Math.random()-0.3)*10**(Math.random()*12|0), b=(Math.random()-0.3)*10**(Math.random()*12|0);
  ok(close(D(a).add(b).toNumber(),a+b),'add'); ok(close(D(a).mul(b).toNumber(),a*b),'mul');
  ok(D(a).gt(b)===(a>b),'gt');
}
ok(D('1e30').mul(D('1e30')).e===60,'1e30²→e60');
ok(D(-4435).lte(0)===true,'signe: dmg>hp tue le monstre');
ok(fmt(1e21)==='1.00Sx','fmt 1e21=1.00Sx');
ok(/e\d+$/.test(fmt(D('1e80').mul(D('1e80')))),'fmt scientifique au-delà des suffixes');
console.log('[bignum] module importé & vérifié');

// ---- heroes (data) ----
ok(Array.isArray(HERO_DEFS),'HERO_DEFS est un tableau');
ok(HERO_DEFS.length>=12, `HERO_DEFS length=${HERO_DEFS.length} (≥12)`);
const ids=HERO_DEFS.map(h=>h.id);
ok(new Set(ids).size===ids.length,'ids uniques');
ok(HERO_DEFS.every(h=>h.id&&h.name&&h.element&&h.bb&&h.leaderSkill),'chaque héros a id/name/element/bb/leaderSkill');
const elems=new Set(HERO_DEFS.map(h=>h.element));
ok(['fire','water','earth','thunder','light','dark'].every(e=>elems.has(e)),`6 éléments couverts: ${[...elems].join(',')}`);

// ---- events (bus) ----
let got=null, n=0; const h=p=>{got=p;n++;};
on('monster:killed',h); emit('monster:killed',{gold:42});
ok(got&&got.gold===42,'emit délivre le payload');
emit('monster:killed',{gold:1}); ok(n===2,'listener rappelé à chaque emit');
off('monster:killed',h); emit('monster:killed',{gold:9}); ok(n===2,'off désabonne');
ok(()=>{emit('inconnu',{});return true;},'emit sur événement sans listener ne crashe pas');

// ---- rng (seedé) ----
const r1=createRng(12345), r2=createRng(12345), r3=createRng(99999);
const s1=[r1(),r1(),r1()], s2=[r2(),r2(),r2()];
ok(JSON.stringify(s1)===JSON.stringify(s2),'même seed → même séquence (déterministe)');
ok(s1.every(x=>x>=0&&x<1),'rng dans [0,1)');
ok(JSON.stringify(s1)!==JSON.stringify([r3(),r3(),r3()]),'seeds différents → séquences différentes');

console.log(`\nPASS: ${pass}   FAIL: ${fail}`);
if(fail) fails.slice(0,10).forEach(f=>console.log('  x',f));
process.exit(fail?1:0);
