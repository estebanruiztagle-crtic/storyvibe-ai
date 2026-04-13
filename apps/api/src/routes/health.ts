import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'storyvibe-api',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
    env: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? 'NOT_SET',
      hasRecraftKey: !!process.env.RECRAFT_API_KEY,
      nodeVersion: process.version,
    },
  })
})

export { router as healthRouter }
