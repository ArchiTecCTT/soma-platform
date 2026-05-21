import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './index';
import { parseApiEnv } from './env';

const env = parseApiEnv(process.env);
const app = createApp(process.env);

const port = Number(env.API_PORT);

console.log(`Server starting on port ${port}...`);
serve({
  fetch: app.fetch,
  port,
});
