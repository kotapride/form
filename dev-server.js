import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import submitHandler from './api/submit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serverless API bridge for local development with hot-reloading
app.all('/api/submit', async (req, res) => {
  try {
    const { default: handler } = await import(`./api/submit.js?t=${Date.now()}`);
    return handler(req, res);
  } catch (err) {
    console.error('API execution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  // Integrate Vite SPA in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 APP 1 (user-form) running at: http://localhost:${PORT}`);
    console.log(`  🔗 Serverless API available at: http://localhost:${PORT}/api/submit`);
    console.log(`======================================================\n`);
  });
}

startServer();
