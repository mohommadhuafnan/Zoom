import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const frontendDir = path.join(root, 'frontend');
const backendDir = path.join(root, 'backend');
const publicDir = path.join(backendDir, 'public');
const distDir = path.join(frontendDir, 'dist');
const envDesktop = path.join(frontendDir, '.env.desktop');

const desktopEnv = `VITE_DESKTOP=true
VITE_API_URL=http://localhost:5123/api
VITE_SOCKET_URL=http://localhost:5123
`;

console.log('Preparing UniMeet desktop build...');

if (!fs.existsSync(envDesktop)) {
  fs.writeFileSync(envDesktop, desktopEnv);
  console.log('Created frontend/.env.desktop');
}

dotenv.config({ path: path.join(backendDir, '.env') });

const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  VITE_DESKTOP: 'true',
  VITE_API_URL: 'http://localhost:5123/api',
  VITE_SOCKET_URL: 'http://localhost:5123',
  VITE_SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_PUBLISHABLE_KEY:
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  VITE_PUBLIC_APP_URL:
    process.env.VITE_PUBLIC_APP_URL || process.env.CLIENT_URL || 'https://zoom-xi-ten.vercel.app',
};

console.log('Installing frontend dependencies...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('Building frontend for desktop...');
execSync('npm run build:desktop', { cwd: frontendDir, stdio: 'inherit', env: buildEnv });

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist was not created');
  process.exit(1);
}

if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.cpSync(distDir, publicDir, { recursive: true });
console.log('Copied frontend/dist → backend/public');

console.log('Installing backend dependencies...');
execSync('npm install --omit=dev', { cwd: backendDir, stdio: 'inherit' });

const envExample = path.join(backendDir, '.env.example');
const envFile = path.join(backendDir, '.env');
if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
  console.warn(
    'Warning: backend/.env not found. Copy backend/.env.example to backend/.env and add your Supabase keys before distributing the installer.'
  );
}

console.log('Desktop package ready. Run: npm run build:desktop');
