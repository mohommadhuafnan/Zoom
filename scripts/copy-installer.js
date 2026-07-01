import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const releaseDir = path.join(root, 'release');

const exes = fs
  .readdirSync(releaseDir)
  .filter((f) => f.startsWith('UniMeet-Setup') && f.endsWith('.exe'));

if (!exes.length) {
  console.error('No UniMeet-Setup-*.exe in release/. Run: npm run build:desktop');
  process.exit(1);
}

const exe = exes.sort((a, b) => {
  const va = a.match(/UniMeet-Setup-(.+)\.exe/)?.[1] || '0';
  const vb = b.match(/UniMeet-Setup-(.+)\.exe/)?.[1] || '0';
  return vb.localeCompare(va, undefined, { numeric: true });
})[0];

const src = path.join(releaseDir, exe);
const version = exe.match(/UniMeet-Setup-(.+)\.exe/)?.[1] || '1.1.0';
const zipName = `UniMeet-Setup-${version}.zip`;
const zipPath = path.join(releaseDir, zipName);

const targets = [];

for (const dest of targets) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const mb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1);
  console.log(`Copied ${exe} → ${dest} (${mb} MB)`);
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${src.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force"`,
  { stdio: 'inherit' }
);
console.log(`Created ${zipName} (${(fs.statSync(zipPath).size / (1024 * 1024)).toFixed(1)} MB)`);
