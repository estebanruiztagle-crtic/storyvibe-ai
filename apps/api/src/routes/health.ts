import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'storyvibe-api',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  })
})

export { router as healthRouter }
