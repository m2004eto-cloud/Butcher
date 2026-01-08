import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../server/index';

// Create server once and reuse
let app: ReturnType<typeof createServer> | null = null;

function getApp() {
  if (!app) {
    app = createServer();
  }
  return app;
}

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = getApp();
    
    // Get the path from query parameter (Vercel passes it as 'path' from the rewrite)
    const pathParam = req.query.path;
    
    if (pathParam) {
      // Reconstruct the full API path
      const pathArray = Array.isArray(pathParam) ? pathParam : [pathParam];
      const queryString = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      req.url = '/api/' + pathArray.join('/') + queryString;
    } else if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
    
    console.log('[Vercel Handler] Processing:', req.method, req.url);
    
    // Pass to Express
    return expressApp(req as any, res as any);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
