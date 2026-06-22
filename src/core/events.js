// §1.7 core/events.js — Bus d'événements pub/sub
// Découple systèmes & UI : combat émet 'monster:killed', retention et UI écoutent.
// Pas de TODO d'extraction : ce module est NOUVEAU (n'existe pas encore dans index.html).

const _listeners = {};

export function on(event, fn) {
    (_listeners[event] = _listeners[event] || []).push(fn);
}

export function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(f => f !== fn);
}

export function emit(event, payload) {
    (_listeners[event] || []).forEach(fn => fn(payload));
}

// Événements standards prévus :
// 'monster:killed'   { zone, isBoss, gold }
// 'hero:levelup'     { heroId, level }
// 'prestige'         { crystals }
// 'quest:progress'   { questIndex, value }
// 'zone:cleared'     { zone }
// 'party:death'      {}
