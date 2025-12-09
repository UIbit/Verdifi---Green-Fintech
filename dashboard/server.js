import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCarbon from '../index.js';
import SecurityMonitor from '../src/securityMonitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
// CORS configuration - use environment variable for allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

const io = new SocketIOServer(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Initialize Security Monitor
const securityMonitor = new SecurityMonitor();

// Security middleware - monitor all requests
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  
  // Monitor connection
  securityMonitor.monitorConnection(ip, userAgent);
  
  // Monitor API requests
  res.on('finish', () => {
    securityMonitor.monitorAPIRequest(req.path, req.method, res.statusCode);
  });
  
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Security API endpoint
app.get('/api/security/stats', (_req, res) => {
  res.json(securityMonitor.getSecurityStats());
});

app.get('/api/security/events', (_req, res) => {
  const limit = parseInt(_req.query.limit) || 20;
  res.json(securityMonitor.getRecentEvents(limit));
});

io.on('connection', async (socket) => {
  const nodeCarbon = new NodeCarbon();
  const clientIP = socket.handshake.address || 'unknown';
  const userAgent = socket.handshake.headers['user-agent'] || 'unknown';

  // Log secure connection
  securityMonitor.logEvent('socket_connection', 'low', {
    ip: clientIP,
    userAgent,
    socketId: socket.id
  });

  // Send static energy info once on connect
  try {
    const energyInfo = await nodeCarbon.getEnergyInfo();
    socket.emit('energyInfo', energyInfo);
  } catch (err) {
    securityMonitor.logEvent('energy_info_error', 'medium', { error: err?.message });
    socket.emit('error', { message: 'Failed to load energy info', details: err?.message });
  }

  // Send initial security stats
  socket.emit('securityStats', securityMonitor.getSecurityStats());
  socket.emit('securityEvents', securityMonitor.getRecentEvents(10));

  // Send security updates periodically
  const securityInterval = setInterval(() => {
    socket.emit('securityStats', securityMonitor.getSecurityStats());
    socket.emit('securityEvents', securityMonitor.getRecentEvents(10));
  }, 5000); // Update every 5 seconds

  let isClosed = false;
  let loopActive = false;

  const measureOnce = async () => {
    try {
      await nodeCarbon.start();
      // Short window to gather CPU/memory deltas
      await new Promise((r) => setTimeout(r, 1000));
      const result = await nodeCarbon.stop();
      socket.emit('measurement', {
        timestamp: Date.now(),
        cpuUsageWatts: result.cpuUsageInfo.cpuUsage,
        cpuTimeSeconds: result.cpuUsageInfo.totalTimeInSeconds,
        rssDeltaMB: result.memoryUsageInfo.rssDeltaMB,
        heapTotalDeltaMB: result.memoryUsageInfo.heapTotalDeltaMB,
        heapUsedDeltaMB: result.memoryUsageInfo.heapUsedDeltaMB,
        carbonEmission: result.carbonEmission,
        elapsedTimeMs: result.elapsedTime
      });
    } catch (err) {
      socket.emit('error', { message: 'Measurement failed', details: err?.message });
    }
  };

  const startLoop = async () => {
    if (loopActive) return;
    loopActive = true;
    while (!isClosed) {
      // run one sample per ~2s (1s measurement + ~1s gap)
      await measureOnce();
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  socket.on('start', () => {
    securityMonitor.logEvent('measurement_started', 'low', { socketId: socket.id });
    startLoop();
  });
  
  socket.on('stop', () => {
    securityMonitor.logEvent('measurement_stopped', 'low', { socketId: socket.id });
    isClosed = true;
  });
  
  socket.on('disconnect', () => {
    clearInterval(securityInterval);
    securityMonitor.logEvent('socket_disconnect', 'low', { socketId: socket.id });
    isClosed = true;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dashboard running on http://localhost:${PORT}`);
});


