import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const releaseDir = path.join(root, 'release');

const exe = fs
  .readdirSync(releaseDir)
  .find((f) => f.startsWith('UniMeet-Setup') && f.endsWith('.exe'));

if (!exe) {
  console.error('No UniMeet-Setup-*.exe in release/. Run: npm run build:desktop');
  process.exit(1);
}

const src = path.join(releaseDir, exe);
const targets = [
  path.join(root, 'frontend', 'public', 'downloads', 'UniMeet-Setup.exe'),
  path.join(root, 'backend', 'public', 'downloads', 'UniMeet-Setup.exe'),
];

for (const dest of targets) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const mb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1);
  console.log(`Copied ${exe} → ${dest} (${mb} MB)`);
}
