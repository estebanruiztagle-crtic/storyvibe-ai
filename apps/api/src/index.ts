import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import path from 'path'
import { fileURLToPath } from 'url'
import { healthRouter } from './routes/health'
import { zone1Router } from './routes/zones/zone1'
import { zone2Router } from './routes/zones/zone2'
import { zone3Router } from './routes/zones/zone3'
import { zone4Router } from './routes/zones/zone4'
import zone5Router from './routes/zones/zone5'
import { act3Router } from './routes/act3'

// Load .env from the api package root regardless of where the process was started
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const dotenvPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: dotenvPath, override: true })

const app = express()
const PORT = process.env['PORT'] ?? 3001

app.use(
  cors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
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
app.use('/api/v1/act3', act3Router)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

app.listen(PORT, () => {
  console.log(`StoryVibe API running on port ${PORT}`)
})

export default app
