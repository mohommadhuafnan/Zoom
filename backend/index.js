import { createApp } from './src/app.js';

const app = createApp();

/** Vercel @vercel/node expects an explicit (req, res) handler */
export default function handler(req, res) {
  return app(req, res);
}
