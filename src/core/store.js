// §1.7 core/store.js — Conteneur d'état central + dirty flag.
// Cible du câblage : remplace le `let G` global du monolithe.
import { DEFAULT_STATE, deepMerge } from './save.js';

let _state = deepMerge({}, DEFAULT_STATE);
let _dirty = false;

export const getState  = () => _state;
export function setState(s) { _state = s; }
export function patch(p)    { _state = deepMerge(_state, p); markDirty(); }
export function resetState(){ _state = deepMerge({}, DEFAULT_STATE); markDirty(); }
export const markDirty  = () => { _dirty = true; };
export const isDirty    = () => _dirty;
export const clearDirty = () => { _dirty = false; };
