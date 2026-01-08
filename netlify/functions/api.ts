import serverless from "serverless-http";
import { createServer } from "../../server";

const app = createServer();

// Handler for Netlify Functions
// Netlify rewrites /api/xxx to /.netlify/functions/api/xxx
// The :splat captures 'xxx' and passes it in event.path as '/xxx'
// We need to prepend '/api' so Express routes match
export const handler = serverless(app, {
  request: (request: any, event: any) => {
    // event.path contains the path after the function name (e.g., '/delivery/addresses')
    // We need to prepend '/api' to match our Express routes
    const path = event.path || '';
    if (!path.startsWith('/api')) {
      request.url = '/api' + path;
    }
  },
});
