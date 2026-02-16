import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { dbConnection } from './dataBase/dbConnection.js'
import { routes } from './src/modules/index.routes.js'
import { startBackupCron } from './src/backups/backup.cron.js'
import cors from 'cors'
import * as dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('Current working directory:', process.cwd());

const app = express()
// Match frontend baseURL: http://localhost:4000/api/v1
const port = process.env.PORT || 4000

// CORS configuration: allow origin from env or fallback to true in dev
const allowedOrigin = process.env.ALLOWED_ORIGIN === 'true' ? true : process.env.ALLOWED_ORIGIN || true;
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Health check endpoints
app.get('/', (req, res) => {
    res.status(200).send('API is running');
});

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

routes(app)

// Serve Frontend static files from Frontend/dist
const frontendPath = path.join(__dirname, '../Frontend/dist')

if (fs.existsSync(frontendPath)) {
    console.log(`[Static] Serving frontend from: ${frontendPath}`);
    app.use(express.static(frontendPath))

    // Handle SPA routing: serve index.html for unknown non-API routes
    app.get('*', (req, res, next) => {
        if (req.url.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    console.warn(`[Static] Frontend path not found: ${frontendPath}. SPA routing disabled.`);
}

// 404 for unknown routes (must be before error handler)
app.use((req, res) => {
    console.warn(`[${new Date().toISOString()}] 404 - ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Not found' });
});

// Global error handler: log and return JSON (catches errors passed to next(err))
app.use((err, req, res, next) => {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    console.error(`[${new Date().toISOString()}] Error ${status} - ${req.method} ${req.url}`, message);
    if (err.stack) console.error(err.stack);
    res.status(status).json({ message, ...(err.response?.data && { details: err.response.data }) });
});

async function bootstrap() {
    await dbConnection()
    startBackupCron()
    app.listen(port, () => console.log(`API server listening on port ${port} (http://localhost:${port}/api/v1)`))
}
bootstrap().catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
})

process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection', err)
})