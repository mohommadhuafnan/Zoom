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
const rootVercelPath = path.join(repoRoot, 'vercel.json');

const backendVercelPath = path.join(backendDir, 'vercel.json');

function isBackendStandaloneDeploy() {
  if (!fs.existsSync(backendVercelPath)) return false;
  try {
    const config = JSON.parse(fs.readFileSync(backendVercelPath, 'utf8'));
    return config.builds?.some(
      (b) => b.use === '@vercel/static-build' && b.config?.distDir === 'public'
    );
  } catch {
    return false;
  }
}

function isMonorepoDeploy() {
  // Root Directory = backend uses backend/vercel.json — must build public/
  if (isBackendStandaloneDeploy()) return false;
  if (!fs.existsSync(rootVercelPath)) return false;
  try {
    const config = JSON.parse(fs.readFileSync(rootVercelPath, 'utf8'));
    return config.builds?.some((b) => String(b.src).includes('frontend/package.json'));
  } catch {
    return false;
  }
}

function copyDistToPublic() {
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, publicDir, { recursive: true });
  console.log('Frontend copied to backend/public');
}

// Root vercel.json builds frontend separately — skip public folder
if (isMonorepoDeploy()) {
  console.log('Monorepo deploy detected — skipping backend/public build');
  process.exit(0);
}

console.log('Standalone backend deploy — building frontend into public/...');

if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.error('frontend/ not found. Set Vercel Root Directory to repository root (.)');
  process.exit(1);
}

if (fs.existsSync(distDir)) {
  copyDistToPublic();
  process.exit(0);
}

execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist not created after build');
  process.exit(1);
}

copyDistToPublic();
