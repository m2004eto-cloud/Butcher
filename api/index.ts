import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../server';

// Create Express app instance
const app = createServer();

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel rewrites /api/xxx to /api, so we need to restore the original path
  // The original URL is in req.url but without the /api prefix after rewrite
  // We need to check x-now-route-matches or use the original URL
  
  // Get the original path from headers or URL
  const originalUrl = req.headers['x-matched-path'] as string || req.url || '/';
  
  // If the URL doesn't start with /api, we need to reconstruct it
  // Vercel sends the full path in req.url
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  
  // Pass to Express
  return app(req as any, res as any);
}
