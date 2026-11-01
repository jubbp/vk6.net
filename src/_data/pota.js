import { readContent } from '../_lib/content.js';
// Parks on the Air figures for WA: content/pota/summary.json, written weekly by scripts/fetch-pota.mjs
// (.github/workflows/pota.yml). The hourly site build only reads it; it never calls POTA. null if missing.
export default () => { const c = readContent('pota/summary.json'); return c ? JSON.parse(c.text) : null; };
