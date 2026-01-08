import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inline import to avoid path resolution issues in Vercel
let app: any = null;

async function getApp() {
  if (!app) {
    try {
      // Dynamic import for the server
      const serverModule = await import('../server/index');
      app = serverModule.createServer();
    } catch (error) {
      console.error('Failed to create server:', error);
      throw error;
    }
  }
  return app;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();
    
    // Vercel rewrites /api/xxx to /api, so we need to restore the original path
    // If the URL doesn't start with /api, we need to reconstruct it
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
    
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
