import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCarbon from '../index.js';
import ESGFinancialModel from '../src/esgFinancialModel.js';

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
app.use(express.json()); // For JSON body parsing

// Initialize ESG Financial Model
const esgModel = new ESGFinancialModel();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ESG API Endpoints
app.post('/api/esg/calculate', (req, res) => {
  try {
    const { metrics } = req.body;
    const esgScore = esgModel.calculateESGScore(metrics || {});
    res.json({ success: true, data: esgScore });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/esg/financial-impact', (req, res) => {
  try {
    const { esgScore, revenue, carbonEmissions } = req.body;
    const impact = esgModel.calculateFinancialImpact(
      esgScore || 50,
      revenue || 1000000,
      carbonEmissions || 100
    );
    res.json({ success: true, data: impact });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/esg/portfolio', (req, res) => {
  try {
    const { investments } = req.body;
    const portfolio = esgModel.calculatePortfolioESG(investments || []);
    res.json({ success: true, data: portfolio });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/esg/recommendation', (req, res) => {
  try {
    const { currentMetrics, targetMetrics, investmentAmount } = req.body;
    const recommendation = esgModel.generateInvestmentRecommendation(
      currentMetrics || {},
      targetMetrics || {},
      investmentAmount || 100000
    );
    res.json({ success: true, data: recommendation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/esg/carbon-impact', (req, res) => {
  try {
    const { carbonEmissions, electricityCost } = req.body;
    const impact = esgModel.calculateCarbonFinancialImpact(
      carbonEmissions || 100,
      electricityCost || 50000
    );
    res.json({ success: true, data: impact });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

io.on('connection', async (socket) => {
  const nodeCarbon = new NodeCarbon();
  let carbonAccumulator = 0;

  // Send static energy info once on connect
  try {
    const energyInfo = await nodeCarbon.getEnergyInfo();
    socket.emit('energyInfo', energyInfo);

    // Calculate initial ESG metrics based on energy info
    const initialESGMetrics = {
      carbonFootprint: energyInfo.carbon_intensity_electricity || 400,
      renewableEnergy: ((energyInfo.renewables_electricity || 0) / 
                       (energyInfo.coal_electricity + energyInfo.gas_electricity + 
                        energyInfo.renewables_electricity || 1)) * 100,
      wasteReduction: 75,
      employeeSatisfaction: 85,
      diversity: 60,
      communityImpact: 70,
      boardIndependence: 80,
      transparency: 75,
      ethicsCompliance: 85
    };

    const esgScore = esgModel.calculateESGScore(initialESGMetrics);
    socket.emit('esgScore', esgScore);

    // Calculate financial impact
    const revenue = 1000000; // Sample revenue
    const carbonEmissions = (energyInfo.carbon_intensity_electricity || 400) / 1000; // Convert to tons
    const financialImpact = esgModel.calculateFinancialImpact(
      esgScore.overall,
      revenue,
      carbonEmissions
    );
    socket.emit('esgFinancialImpact', financialImpact);
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
      
      // Accumulate carbon for ESG calculations
      carbonAccumulator += result.carbonEmission || 0;
      
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

      // Periodically update ESG financial metrics based on accumulated carbon
      if (carbonAccumulator > 0.001) {
        const revenue = 1000000;
        const carbonTons = carbonAccumulator / 1000; // Convert to tons
        
        const esgMetrics = {
          carbonFootprint: carbonTons * 100,
          renewableEnergy: 60,
          wasteReduction: 75,
          employeeSatisfaction: 85,
          diversity: 60,
          communityImpact: 70,
          boardIndependence: 80,
          transparency: 75,
          ethicsCompliance: 85
        };

        const esgScore = esgModel.calculateESGScore(esgMetrics);
        const financialImpact = esgModel.calculateFinancialImpact(
          esgScore.overall,
          revenue,
          carbonTons
        );

        socket.emit('esgUpdate', {
          esgScore,
          financialImpact,
          carbonAccumulated: carbonAccumulator
        });
      }
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


