// §1.7 core/bignum.js — Wrapper Decimal + fmt() unifié
// EXTRAIT VERBATIM de index.html (§1.5). Source de vérité une fois index.html câblé en module.

export class _Dec {
    constructor(v) {
        if (v instanceof _Dec) { this.m = v.m; this.e = v.e; return; }
        if (typeof v === 'string') { v = parseFloat(v); }
        if (!v || !isFinite(v)) { this.m = (v === Infinity ? 1 : 0); this.e = (v === Infinity ? 9999 : 0); return; }
        const s = v < 0 ? -1 : 1;
        const av = Math.abs(v);
        this.e = av === 0 ? 0 : Math.floor(Math.log10(av));
        this.m = (v / Math.pow(10, this.e));
        this._n();
    }
    _n() {
        if (this.m === 0) { this.e = 0; return; }
        while (Math.abs(this.m) >= 10) { this.m /= 10; this.e++; }
        while (Math.abs(this.m) > 0 && Math.abs(this.m) < 1) { this.m *= 10; this.e--; }
    }
    add(o) {
        o = D(o);
        if (this.e - o.e > 15) return new _Dec(this);
        if (o.e - this.e > 15) return new _Dec(o);
        const diff = this.e - o.e;
        const r = new _Dec(0);
        r.m = this.m * Math.pow(10, diff) + o.m;
        r.e = o.e; r._n(); return r;
    }
    sub(o) { o = D(o); const r = new _Dec(o); r.m = -r.m; return this.add(r); }
    mul(o) { o = D(o); const r = new _Dec(0); r.m = this.m * o.m; r.e = this.e + o.e; r._n(); return r; }
    div(o) { o = D(o); if (o.m === 0) return new _Dec(0); const r = new _Dec(0); r.m = this.m / o.m; r.e = this.e - o.e; r._n(); return r; }
    gt(o)  {
        o = D(o);
        // §BUG-FIX: comparer les signes AVANT les exposants
        // Sinon D(-4435).gt(D(0)) retourne true (e=3 > e=0) → lte(0) = false → killMonster jamais appelé
        if (o.m === 0) return this.m > 0;          // x > 0 ↔ x est positif
        if (this.m === 0) return false;             // 0 n'est supérieur à rien
        if ((this.m > 0) !== (o.m > 0)) return this.m > 0; // signes différents → positif gagne
        const pos = this.m > 0;
        if (this.e !== o.e) return pos ? this.e > o.e : this.e < o.e; // même signe, comparer exposants
        return this.m > o.m;                        // même exposant, comparer mantisses
    }
    gte(o) { o = D(o); return this.gt(o) || (this.e === o.e && Math.abs(this.m - o.m) < 1e-9); }
    lt(o)  { return !this.gte(o); }
    lte(o) { return !this.gt(o); }
    isZero() { return this.m === 0; }
    floor() {
        if (this.e < 0) return new _Dec(0);
        if (this.e >= 15) return new _Dec(this);
        const p = Math.pow(10, this.e);
        return new _Dec(Math.floor(this.m * p));
    }
    ceil() {
        if (this.e < 0) return new _Dec(this.m > 0 ? 1 : 0);
        if (this.e >= 15) return new _Dec(this);
        const p = Math.pow(10, this.e);
        return new _Dec(Math.ceil(this.m * p));
    }
    toNumber() { return this.m * Math.pow(10, this.e); }
    valueOf()  { return this.toNumber(); }   // permet G.gold < number sans coercion fragile
    toJSON()   { return this.e === 0 ? String(this.m) : (this.m + 'e' + this.e); }
    toString() { return this.toJSON(); }
}
export function D(v) { return (v instanceof _Dec) ? v : new _Dec(v); }

// §1.5 — fmt() étendu : suffixes jusqu'à 10^66 puis notation scientifique
export function fmt(n) {
    const d = D(n);
    const e = d.e;
    if (e < 3) return String(Math.floor(d.toNumber()));
    const SUFFIXES = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No',
                      'Dc','UDc','DDc','TDc','QaDc','QiDc','SxDc','SpDc','OcDc','NoDc','Vi'];
    const tier = Math.floor(e / 3);
    if (tier < SUFFIXES.length) {
        const val = d.toNumber() / Math.pow(1000, tier);
        return val.toFixed(val < 10 ? 2 : val < 100 ? 1 : 0) + SUFFIXES[tier];
    }
    return d.m.toFixed(2) + 'e' + d.e;
}
