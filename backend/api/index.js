// Vercel serverless entry point.
// `npm run build` (see vercel.json buildCommand) compiles src/ -> dist/ with tsc,
// then this thin wrapper adapts the Express app to a Vercel request handler.
import { createApp } from "../dist/src/app.js";

const app = createApp();

export default function handler(request, response) {
  return app(request, response);
}
