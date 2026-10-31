import { state } from '../state.js';
const key = id => `kkg_slide_studio_v2_${id}`;
export function readDraft(id = state.user?.id) {
  if (id == null) return null;
  try { const raw = JSON.parse(localStorage.getItem(key(id)) || 'null'); return raw?.version === 2 && Array.isArray(raw.deck?.slides) ? raw : null; } catch { return null; }
}
export function writeDraft(value, id = state.user?.id) {
  if (id == null || String(state.user?.id) !== String(id)) return false;
  try {
    localStorage.setItem(key(id), JSON.stringify({ ...value, version: 2 }));
    return true;
  } catch {
    try {
      if (value?.deck?.slides) {
        const compact = {
          ...value,
          deck: {
            ...value.deck,
            slides: value.deck.slides.map(s => (s.image?.url?.startsWith('data:') ? { ...s, image: { ...s.image, url: '' } } : s))
          },
          version: 2
        };
        localStorage.setItem(key(id), JSON.stringify(compact));
        return true;
      }
    } catch {}
    return false;
  }
}
