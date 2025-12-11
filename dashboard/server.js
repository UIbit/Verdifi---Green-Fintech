import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import NodeCarbon from '../index.js';
import ESGFinancialModel from '../src/esgFinancialModel.js';
import connectDB from '../src/config/database.js';
import authRoutes from '../src/routes/auth.js';
import { requireAuth, requireGuest } from '../src/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

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

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'verdifi-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/verdifi',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
});

app.use(sessionMiddleware);

// Share session with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes (must be before static files)
app.use('/api/auth', authRoutes);

// Serve login page (optional, auth is not required for dashboard)
app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

// Root redirects to dashboard (bypass auth for now)
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Serve dashboard without auth requirement (for development)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Static files (after routes)
app.use(express.static(publicDir));

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

// Socket.IO - allow connections without auth (auth optional for now)
io.use((socket, next) => {
  // Allow all connections - authentication is optional
  next();
});

io.on('connection', async (socket) => {
  const session = socket.request.session || {};
  console.log(`User connected: ${session.username || session.userId || 'guest'}`);
  
  const nodeCarbon = new NodeCarbon();
  let carbonAccumulator = 0;

  // Send static energy info once on connect
  let energyInfo;
  try {
    energyInfo = await nodeCarbon.getEnergyInfo();
    socket.emit('energyInfo', energyInfo);
  } catch (err) {
    console.error('Error loading energy info:', err);
    // Use default energy info if API fails
    energyInfo = {
      country: 'Unknown',
      carbon_intensity_electricity: 400,
      coal_electricity: 100,
      gas_electricity: 100,
      renewables_electricity: 50
    };
    socket.emit('energyInfo', energyInfo);
  }

  // Always calculate and send initial ESG metrics
  try {
    const totalEnergy = (energyInfo.coal_electricity || 100) + 
                       (energyInfo.gas_electricity || 100) + 
                       (energyInfo.renewables_electricity || 50) || 250;
    
    const initialESGMetrics = {
      carbonFootprint: energyInfo.carbon_intensity_electricity || 400,
      renewableEnergy: totalEnergy > 0 ? ((energyInfo.renewables_electricity || 50) / totalEnergy) * 100 : 30,
      wasteReduction: 75,
      employeeSatisfaction: 85,
      diversity: 60,
      communityImpact: 70,
      boardIndependence: 80,
      transparency: 75,
      ethicsCompliance: 85
    };

    const esgScore = esgModel.calculateESGScore(initialESGMetrics);
    console.log('Initial ESG Score:', esgScore);
    socket.emit('esgScore', esgScore);

    // Calculate financial impact
    const revenue = 1000000; // Sample revenue
    const carbonEmissions = ((energyInfo.carbon_intensity_electricity || 400) * 10) / 1000; // Convert to tons (assuming 10 MWh usage)
    const financialImpact = esgModel.calculateFinancialImpact(
      esgScore.overall,
      revenue,
      carbonEmissions
    );
    console.log('Financial Impact:', financialImpact);
    socket.emit('esgFinancialImpact', financialImpact);
  } catch (err) {
    console.error('Error calculating ESG:', err);
    // Send default ESG data
    socket.emit('esgScore', {
      overall: 75,
      environmental: 30,
      social: 23,
      governance: 22
    });
    socket.emit('esgFinancialImpact', {
      esgPremium: '11.25',
      adjustedReturn: '10.25',
      enterpriseValue: '12500000',
      carbonCost: '5000.00',
      potentialSavings: '1500.00'
    });
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
      
      // Track samples count
      if (!socket.sampleCount) socket.sampleCount = 0;
      socket.sampleCount++;

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
      // Update every 5 measurements (approximately every 10 seconds)
      if (socket.sampleCount && socket.sampleCount % 5 === 0 && carbonAccumulator > 0) {
        try {
          const revenue = 1000000;
          const carbonTons = Math.max(0.001, carbonAccumulator / 1000000); // Convert g to tons
          
          // Use energy info for renewable percentage
          const totalEnergy = (energyInfo?.coal_electricity || 100) + 
                             (energyInfo?.gas_electricity || 100) + 
                             (energyInfo?.renewables_electricity || 50) || 250;
          const renewablePct = totalEnergy > 0 ? 
            ((energyInfo?.renewables_electricity || 50) / totalEnergy) * 100 : 30;
          
          const esgMetrics = {
            carbonFootprint: Math.min(1000, carbonTons * 10000), // Scale up for calculation
            renewableEnergy: renewablePct,
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
        } catch (err) {
          console.error('Error updating ESG:', err);
        }
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


