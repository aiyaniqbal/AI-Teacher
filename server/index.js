import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    name: 'EduMind API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Catch-all: serve client app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║           🧠 EduMind Server              ║
║                                          ║
║  Running on http://localhost:${PORT}       ║
║  API: http://localhost:${PORT}/api         ║
║                                          ║
║  📚 AI Teaching Platform                 ║
║  Built with ❤️ for students everywhere    ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
