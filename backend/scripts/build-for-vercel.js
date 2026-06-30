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
const backendVercelPath = path.join(backendDir, 'vercel.json');

/** backend/vercel.json static-build expects output in public/ */
function isPublicFolderRequired() {
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

function copyDistToPublic() {
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  fs.cpSync(distDir, publicDir, { recursive: true });
  console.log('Frontend copied to backend/public');
}

if (!isPublicFolderRequired()) {
  console.log('No backend/public static build configured — skipping');
  process.exit(0);
}

console.log('Building frontend into backend/public for Vercel...');

if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.error(
    'frontend/ not found. Ensure the full repository is cloned (Vercel clones the repo even when Root Directory is backend).'
  );
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
}

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist not created after build');
  process.exit(1);
}

copyDistToPublic();
