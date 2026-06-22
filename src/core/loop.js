// §1.7 core/loop.js — Cœur de la boucle maître fixed-timestep (§1.2), sans DOM.
// Le masterFrame DOM (perf probe, pools, render) reste dans le monolithe ;
// ce module fournit la logique d'accumulateur réutilisable & testable.
export const GAME_TICK = 1 / 30;

export function createFixedTimestep(tick = GAME_TICK, maxDt = 0.25) {
    let acc = 0;
    return function advance(dt, simulate) {
        if (dt > maxDt) dt = maxDt;   // anti "spirale de la mort" après une veille
        acc += dt;
        let steps = 0;
        while (acc >= tick) { if (simulate) simulate(tick); acc -= tick; steps++; }
        return { steps, remainder: acc };
    };
}
