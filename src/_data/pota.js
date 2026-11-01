import { readContent } from '../_lib/content.js';
// Parks on the Air figures for WA, written by scripts/fetch-pota.mjs (content/_live/pota.json). null if not fetched yet.
export default () => { const c = readContent('pota.json'); return c ? JSON.parse(c.text) : null; };
