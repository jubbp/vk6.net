// macOS only: this project lives in an iCloud-synced folder, and iCloud evicts files
// it thinks aren't needed, which makes builds hang. Folders ending in ".nosync" are
// never synced, so keep the packages in node_modules.nosync with node_modules linking to it.
// Runs after every npm install (package.json "postinstall"), because npm replaces the link.
import { existsSync, lstatSync, renameSync, rmSync, symlinkSync } from 'node:fs';

if (process.platform === 'darwin') {
  const link = 'node_modules';
  const real = 'node_modules.nosync';
  if (existsSync(link) && !lstatSync(link).isSymbolicLink()) {
    rmSync(real, { recursive: true, force: true });
    renameSync(link, real);
    symlinkSync(real, link);
    console.log('node_modules moved to node_modules.nosync (kept out of iCloud)');
  }
}
