// Typed API client — single source for all backend calls

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ─── Zone 1 — Context ─────────────────────────────────────────────
export function chatContext(body: {
  message: string
  context: Record<string, unknown>
  conversation: Array<{ role: string; content: string }>
}) {
  return request<{ reply: string; updatedContext: Record<string, unknown> }>(
    '/api/v1/zones/zone1/chat',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

// ─── Zone 2 — Narrative ───────────────────────────────────────────
export function generateTopics(body: { context: Record<string, unknown> }) {
  return request<{ topics: unknown[]; authorPattern: unknown }>(
    '/api/v1/zones/zone2/topics',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function generateFrameworks(body: {
  context: Record<string, unknown>
  topics: unknown[]
}) {
  return request<{ frameworks: unknown[] }>(
    '/api/v1/zones/zone2/frameworks',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function generateCurve(body: {
  context: Record<string, unknown>
  topics: unknown[]
  framework: unknown
}) {
  return request<{ curvePoints: unknown[]; narrativeBrief: string; presentationTitle: string }>(
    '/api/v1/zones/zone2/curve',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

// ─── Zone 3 — Design ─────────────────────────────────────────────
export function generatePalette(body: {
  context: Record<string, unknown>
  curvePoints: unknown[]
}) {
  return request<{ palette: unknown }>(
    '/api/v1/zones/zone3/palette',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function generateGraphics(body: {
  context: Record<string, unknown>
  slides: unknown[]
  palette: unknown
}) {
  return request<{ slides: unknown[] }>(
    '/api/v1/zones/zone3/graphics',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function generateImage(body: {
  prompt: string
  style: string
  palette: string[]
}) {
  return request<{ url: string }>(
    '/api/v1/zones/zone3/image',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

// ─── Zone 4 — Review ─────────────────────────────────────────────
export function evaluatePresentation(body: {
  context: Record<string, unknown>
  slides: unknown[]
  palette: unknown
}) {
  return request<{ scores: unknown[] }>(
    '/api/v1/zones/zone4/evaluate',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

// ─── Zone 5 — Report ─────────────────────────────────────────────
export function generateReport(body: {
  context: Record<string, unknown>
  narrative: Record<string, unknown>
  design: Record<string, unknown>
  review: Record<string, unknown>
}) {
  return request<{ report: string }>(
    '/api/v1/zones/zone5/report',
    { method: 'POST', body: JSON.stringify(body) },
  )
}
