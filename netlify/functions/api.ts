import serverless from "serverless-http";

import { createServer } from "../../server";

const app = createServer();

// Configure serverless-http to handle Netlify's request format
export const handler = serverless(app, {
  request: (request: any, event: any, context: any) => {
    // Ensure the path is correctly set for Express
    // Netlify strips the function path, so we need to ensure /api prefix is preserved
    if (event.path && !event.path.startsWith('/api')) {
      request.url = '/api' + (event.path.startsWith('/') ? event.path : '/' + event.path);
    }
  }
});
