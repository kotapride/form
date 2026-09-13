import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import submitHandler from './api/submit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serverless API bridge for local development
app.all('/api/submit', (req, res) => {
  return submitHandler(req, res);
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
