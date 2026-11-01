import { readCsv } from '../_lib/content.js';
// Supporters who agreed to be listed: content/supporters.csv (Name, Callsign, Type, Since, Url, Logo).
// Logo is a path under src/assets/img/ (white-on-dark artwork; shown on a navy tile).
export default () => readCsv('supporters.csv');
