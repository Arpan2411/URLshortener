const express = require('express');
const cors = require('cors');
const router = express.Router();
const helmet = require('helmet');
const compression = require('compression');
const onHeaders = require('on-headers');
const urlController = require('./controllers/url.controller');
const redirectRoutes = require('./routes/redirect.routes');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { logger } = require('./utils/logger');
const { standardRateLimiter } = require('./middlewares/rateLimiter');
const { setupSwagger } = require('./docs/swagger'); // Import Swagger setup
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Global rate limiter (applied to all routes)
app.use(standardRateLimiter);

// keep track of request coming to the server and log it
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Response time header for performance monitoring

app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(
            `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
        );
    });

    next();
});

// Health check
// app.get('/health', (req, res) => {
//     res.status(200).json({
//         status: 'OK',
//         uptime: process.uptime(),
//         timestamp: new Date().toISOString(),
//     });
// });
// Setup Swagger documentation
setupSwagger(app); // Add this line
// Routes

app.use('/', redirectRoutes);      // Public redirect
app.use('/api', routes);
// app.use('/home', redirectRoutes); // Serve the home page
app.use((req, res) => {
    res.redirect('/');
});

// Error handling
app.use(errorHandler);

module.exports = app;