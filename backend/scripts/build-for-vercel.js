import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '..');
const repoRoot = path.join(backendDir, '..');
const frontendDir = path.join(repoRoot, 'frontend');
const publicDir = path.join(backendDir, 'public');
const distDir = path.join(frontendDir, 'dist');

console.log('Building frontend for Vercel...');

if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.error('frontend/ not found — ensure repo root is correct');
  process.exit(1);
}

execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist not created after build');
  process.exit(1);
}

if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}

fs.cpSync(distDir, publicDir, { recursive: true });
console.log('Frontend copied to backend/public');
