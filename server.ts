import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for correct IP detection in Cloud Run/Proxy environments
  app.set('trust proxy', true);

  // Security Hardening: Disable X-Powered-By
  app.disable('x-powered-by');

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "https://picsum.photos", "https://*.googleusercontent.com", "data:", "referrer"],
        "connect-src": ["'self'", "https://*.run.app", "wss://*.run.app"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(cors({
    origin: true, 
    credentials: true
  }));

  // Limit payload size to prevent DoS
  app.use(express.json({ limit: '1kb' }));
  
  // Protect against HTTP Parameter Pollution
  app.use(hpp());

  // API Routes
  app.get('/api/lookup', async (req, res) => {
    const { number } = req.query;

    if (!number || typeof number !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Number is required' });
    }

    const sanitizedNumber = number.replace(/\D/g, '');
    console.log(`[LOOKUP] Number: ${sanitizedNumber}`);

    try {
      let data: any = { status: 'error' };
      
      // Primary Node
      try {
        const response = await fetch(`https://blacksimdetail.vercel.app/public_apis/simdetailsapi.php?number=${sanitizedNumber}`);
        data = await response.json();
      } catch (e) {
        console.error('Primary node failed');
      }

      // Fallback Node
      if (data.status !== 'success' || !data.data || (Array.isArray(data.data) && data.data.length === 0)) {
        try {
          const response = await fetch(`https://sim-api.fakcloud.tech/api.php?number=${sanitizedNumber}`);
          data = await response.json();
        } catch (e) {
          console.error('Fallback node failed');
        }
      }

      if (data.status === 'success' && data.data) {
        return res.json(data);
      }

      return res.json({ status: 'error', message: 'No records found' });

    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
