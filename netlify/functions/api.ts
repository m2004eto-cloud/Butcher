import serverless from "serverless-http";
import { createServer } from "../../server";

const app = createServer();

// Create the serverless handler
const serverlessHandler = serverless(app);

// Handler for Netlify Functions
// Netlify rewrites /api/xxx to /.netlify/functions/api/xxx
// The :splat captures 'xxx' and passes it in event.path as '/xxx'
// We need to prepend '/api' so Express routes match
export const handler = async (event: any, context: any) => {
  // Prepend '/api' to the path if not already present
  const originalPath = event.path || '';
  if (!originalPath.startsWith('/api')) {
    event.path = '/api' + originalPath;
    // Also update rawUrl if present
    if (event.rawUrl) {
      const url = new URL(event.rawUrl);
      url.pathname = '/api' + url.pathname;
      event.rawUrl = url.toString();
    }
  }
  
  return serverlessHandler(event, context);
};
