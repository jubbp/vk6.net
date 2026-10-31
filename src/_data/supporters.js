import { readCsv } from '../_lib/content.js';
// Supporters who agreed to be listed: content/supporters.csv (Name, Callsign, Type, Since).
export default () => readCsv('supporters.csv');
