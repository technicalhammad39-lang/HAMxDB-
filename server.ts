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
    console.log(`[DUMMY LOOKUP] Number: ${sanitizedNumber}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate dummy data based on the number
    const dummyData = [
      {
        Name: "DEMO USER - " + sanitizedNumber.substring(0, 4),
        Mobile: sanitizedNumber,
        Country: "Pakistan",
        CNIC: "42101-XXXXXXX-" + sanitizedNumber.substring(sanitizedNumber.length - 1),
        Address: "Sector 11-G, North Karachi, Karachi, Pakistan"
      },
      {
        Name: "SIM OWNER - " + sanitizedNumber.substring(sanitizedNumber.length - 4),
        Mobile: sanitizedNumber,
        Country: "Pakistan",
        CNIC: "35202-XXXXXXX-" + sanitizedNumber.substring(0, 1),
        Address: "Street 5, Model Town, Lahore, Punjab"
      }
    ];

    return res.json({
      status: 'success',
      data: dummyData,
      total_records: dummyData.length,
      note: "This is simulated demonstration data."
    });
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
