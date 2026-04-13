import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

  // Global Rate Limiting (General protection)
  const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200, // Increased for better dev experience
    message: { status: 'error', message: 'System busy. Please try again later.' }
  });
  app.use('/api/', globalLimiter);

  // Stricter Rate Limiting for Data Lookups
  const lookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 lookups per 15 mins
    message: { status: 'error', message: 'Security Alert: Excessive lookup attempts detected. Access restricted for 15 minutes.' }
  });

  // API Routes
  app.get('/api/lookup', lookupLimiter, async (req, res) => {
    const { number } = req.query;

    // 1. Strict Input Validation
    if (!number || typeof number !== 'string' || number.length < 5 || number.length > 15) {
      return res.status(400).json({ status: 'error', message: 'Invalid query format.' });
    }

    // Sanitize input: only allow digits
    const sanitizedNumber = number.replace(/\D/g, '');
    
    if (sanitizedNumber.length < 5) {
       return res.status(400).json({ status: 'error', message: 'Query rejected: Insufficient data.' });
    }

    // Security Audit Log (Masked)
    const maskedNumber = sanitizedNumber.length > 4 
      ? sanitizedNumber.substring(0, 4) + '****' + sanitizedNumber.substring(sanitizedNumber.length - 2)
      : '****';
    console.log(`[AUDIT] Lookup Request | IP: ${req.ip} | Target: ${maskedNumber} | Time: ${new Date().toISOString()}`);

    // Basic Anti-Bot Check
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('curl') || userAgent.includes('Postman') || userAgent.includes('python-requests')) {
      console.warn(`[SECURITY] Bot detected from IP: ${req.ip} | UA: ${userAgent}`);
      return res.status(403).json({ status: 'error', message: 'Access Denied: Automated tools not allowed.' });
    }

    // 3. Secure Data Fetching with Timeouts and Headers
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        console.log(`[FETCH] Requesting: ${url.split('?')[0]}...`);
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://blacksimdetail.vercel.app/'
          }
        });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        console.error(`[FETCH ERROR] ${url.split('?')[0]}:`, e instanceof Error ? e.message : e);
        throw e;
      }
    };

    try {
      let data;
      // Primary Node
      try {
        const response = await fetchWithTimeout(`https://blacksimdetail.vercel.app/public_apis/simdetailsapi.php?number=${sanitizedNumber}`);
        if (response.ok) {
          data = await response.json();
          console.log(`[NODE 1] Status: ${response.status} | Success: ${data.status === 'success'}`);
        } else {
          console.warn(`[NODE 1] Failed with status: ${response.status}`);
          data = { status: 'error' };
        }
      } catch (e) {
        data = { status: 'error' };
      }

      // Fallback Node
      if (data.status !== 'success' || !data.data || data.data.length === 0) {
        console.log('[NODE 2] Attempting fallback...');
        try {
          const response = await fetchWithTimeout(`https://sim-api.fakcloud.tech/api.php?number=${sanitizedNumber}`);
          if (response.ok) {
            data = await response.json();
            console.log(`[NODE 2] Status: ${response.status} | Success: ${data.status === 'success'}`);
          } else {
            console.warn(`[NODE 2] Failed with status: ${response.status}`);
            return res.status(502).json({ status: 'error', message: 'Security Protocol: Data nodes unreachable.' });
          }
        } catch (e) {
          return res.status(502).json({ status: 'error', message: 'Security Protocol: Data nodes unreachable.' });
        }
      }

      // Filter and return only necessary data
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

      return res.json({ status: 'error', message: 'No records found in global database.' });

    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal Security Error.' });
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
