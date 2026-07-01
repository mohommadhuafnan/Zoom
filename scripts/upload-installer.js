import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, 'backend', '.env');
const installerSrc = path.join(root, 'release', 'UniMeet Setup 1.0.0.exe');

dotenv.config({ path: envPath });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env');
  process.exit(1);
}

if (!fs.existsSync(installerSrc)) {
  console.error('Installer not found. Run: npm run build:desktop');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'unimeet-downloads';
const OBJECT = 'UniMeet-Setup.exe';

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) return;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 120 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Create bucket failed: ${error.message}`);
  }
}

async function upload() {
  await ensureBucket();

  const file = fs.readFileSync(installerSrc);
  const { error } = await supabase.storage.from(BUCKET).upload(OBJECT, file, {
    contentType: 'application/octet-stream',
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(OBJECT);
  const downloadUrl = data.publicUrl;

  const outPath = path.join(root, 'scripts', '.download-url.txt');
  fs.writeFileSync(outPath, downloadUrl);
  console.log('UPLOAD_OK');
  console.log(downloadUrl);
}

upload().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
