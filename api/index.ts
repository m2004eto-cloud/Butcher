import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../server';

const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express-compatible handler for Vercel
  return app(req as any, res as any);
}
