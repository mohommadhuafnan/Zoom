import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

const DEFAULT_VERSION = '1.1.0';
const GITHUB_REPO = 'mohommadhuafnan/Zoom';

router.get('/info', (_req, res) => {
  const baseUrl = env.clientUrl.replace(/\/$/, '');
  const version = process.env.APP_VERSION || DEFAULT_VERSION;
  const downloadUrl =
    process.env.APP_DOWNLOAD_URL ||
    `https://github.com/${GITHUB_REPO}/releases/latest/download/UniMeet-Setup-${version}.exe`;

  res.json({
    name: 'UniMeet',
    version,
    platform: 'windows',
    downloadUrl,
    directSetupUrl: downloadUrl,
    shareUrl: `${baseUrl}/download`,
    desktop: process.env.DESKTOP_MODE === 'true',
  });
});

/** Redirect straight to the hosted .exe (for share links that download immediately). */
router.get('/setup', (_req, res) => {
  const version = process.env.APP_VERSION || DEFAULT_VERSION;
  const url =
    process.env.APP_DOWNLOAD_URL ||
    `https://github.com/${GITHUB_REPO}/releases/latest/download/UniMeet-Setup-${version}.exe`;
  res.redirect(302, url);
});

export default router;
