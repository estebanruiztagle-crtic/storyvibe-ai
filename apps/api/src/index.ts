import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import path from 'path'
import { healthRouter } from './routes/health'
import { zone1Router } from './routes/zones/zone1'
import { zone2Router } from './routes/zones/zone2'
import { zone3Router } from './routes/zones/zone3'
import { zone4Router } from './routes/zones/zone4'
import zone5Router from './routes/zones/zone5'

// Load .env from the api package root (local dev only; Vercel uses dashboard env vars)
if (process.env.NODE_ENV !== 'production') {
  const dotenvPath = path.resolve(__dirname, '../.env')
  dotenv.config({ path: dotenvPath, override: true })
}

const app = express()
const PORT = process.env['PORT'] ?? 3001

// Support comma-separated list of allowed origins via ALLOWED_ORIGINS env var
// e.g. ALLOWED_ORIGINS=https://storyvibe.vercel.app,http://localhost:3000
const rawOrigins = process.env['ALLOWED_ORIGINS'] ?? process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      // Allow any vercel.app preview deployment
      if (origin.endsWith('.vercel.app')) return callback(null, true)
      callback(new Error(`CORS: origin not allowed — ${origin}`))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

// Routes
app.use('/api/v1/health', healthRouter)
app.use('/api/v1/zones/zone1', zone1Router)
app.use('/api/v1/zones/zone2', zone2Router)
app.use('/api/v1/zones/zone3', zone3Router)
app.use('/api/v1/zones/zone4', zone4Router)
app.use('/api/v1/zones/zone5', zone5Router)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

// Start server only in non-serverless environments
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`StoryVibe API running on port ${PORT}`)
  })
}

export default app
