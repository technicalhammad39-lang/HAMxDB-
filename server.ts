import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a secret from environment or a fallback for development
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    crossOriginEmbedderPolicy: false, // Often needed for Vite/React
  }));
  
  app.use(cors({
    origin: true, // Allow all origins for now, but in production this should be restricted
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: { status: 'error', message: 'Too many requests from this IP, please try again after 15 minutes' }
  });

  // Session Initialization Endpoint
  // This provides a temporary token to the frontend to authorize lookups
  app.get('/api/session', (req, res) => {
    const token = jwt.sign({ timestamp: Date.now() }, SESSION_SECRET, { expiresIn: '1h' });
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });
    res.json({ status: 'success' });
  });

  // API Routes
  app.get('/api/lookup', limiter, async (req, res) => {
    const { number } = req.query;
    const token = req.cookies.session_token;

    // 1. Validate Session Token
    if (!token) {
      console.warn(`Unauthorized access attempt from IP: ${req.ip}`);
      return res.status(401).json({ status: 'error', message: 'Unauthorized: No session token found' });
    }

    try {
      jwt.verify(token, SESSION_SECRET);
    } catch (err) {
      console.warn(`Invalid session token from IP: ${req.ip}`);
      return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired session' });
    }

    // 2. Validate Input
    if (!number || typeof number !== 'string' || number.length < 5 || number.length > 15) {
      return res.status(400).json({ status: 'error', message: 'Invalid input format. Provide a valid number (5-15 digits).' });
    }

    // Sanitize input: only allow digits
    const sanitizedNumber = number.replace(/\D/g, '');
    
    if (sanitizedNumber.length < 5) {
       return res.status(400).json({ status: 'error', message: 'Invalid input format after sanitization' });
    }

    console.log(`[LOOKUP] IP: ${req.ip} | Number: ${sanitizedNumber.substring(0, 4)}****`);

    try {
      let data;
      // Primary Node
      try {
        const response = await fetch(`https://blacksimdetail.vercel.app/public_apis/simdetailsapi.php?number=${sanitizedNumber}`);
        data = await response.json();
      } catch (e) {
        console.error('Primary node fetch failed:', e);
        data = { status: 'error' };
      }

      // Fallback Node
      if (data.status !== 'success' || !data.data || data.data.length === 0) {
        try {
          const response = await fetch(`https://sim-api.fakcloud.tech/api.php?number=${sanitizedNumber}`);
          data = await response.json();
        } catch (e) {
          console.error('Secondary node fetch failed:', e);
          return res.status(502).json({ status: 'error', message: 'Data nodes unreachable. Please try again later.' });
        }
      }

      // Filter and return only necessary data to the client
      if (data.status === 'success' && data.data) {
        const filteredData = data.data.map((item: any) => ({
          Name: item.Name || 'N/A',
          Mobile: item.Mobile || 'N/A',
          Country: item.Country || 'Pakistan',
          CNIC: item.CNIC || 'N/A',
          Address: item.Address || 'N/A'
        }));

        return res.json({
          status: 'success',
          data: filteredData,
          total_records: filteredData.length
        });
      }

      return res.json({ status: 'error', message: 'No records found in the database.' });

    } catch (error) {
      console.error('Internal Lookup Error:', error);
      res.status(500).json({ status: 'error', message: 'A server-side error occurred. Please contact support.' });
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
