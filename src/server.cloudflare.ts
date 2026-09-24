import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularApp = new AngularAppEngine();

/**
 * Cloudflare Workers fetch handler.
 * Uses @angular/ssr neutral platform (no Node.js APIs) —
 * fully compatible with the V8-based Cloudflare Workers runtime.
 */
const reqHandler = createRequestHandler(async (req: Request) => {
  const res = await angularApp.handle(req);
  return res ?? new Response('Page not found.', { status: 404 });
});

export default {
  fetch: reqHandler,
};
