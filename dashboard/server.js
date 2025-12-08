import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCarbon from '../index.js';

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', async (socket) => {
  const nodeCarbon = new NodeCarbon();

  // Send static energy info once on connect
  try {
    const energyInfo = await nodeCarbon.getEnergyInfo();
    socket.emit('energyInfo', energyInfo);
  } catch (err) {
    socket.emit('error', { message: 'Failed to load energy info', details: err?.message });
  }

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

  socket.on('start', () => startLoop());
  socket.on('stop', () => { isClosed = true; });
  socket.on('disconnect', () => { isClosed = true; });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dashboard running on http://localhost:${PORT}`);
});


