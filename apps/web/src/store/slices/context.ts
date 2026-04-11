// Slice: Zone 1 — Diagnóstico / Contexto
import type { StateCreator } from 'zustand'
import type { Zone1Context } from '@/components/zones/zone1/types'

export interface ContextSlice {
  context: Zone1Context | null
  contextLoading: boolean
  setContext: (ctx: Zone1Context) => void
  patchContext: (patch: Partial<Zone1Context>) => void
  clearContext: () => void
  setContextLoading: (v: boolean) => void
}

export const createContextSlice: StateCreator<ContextSlice> = (set) => ({
  context: null,
  contextLoading: false,
  setContext: (ctx) => set({ context: ctx }),
  patchContext: (patch) =>
    set((s) => ({ context: s.context ? { ...s.context, ...patch } : null })),
  clearContext: () => set({ context: null }),
  setContextLoading: (v) => set({ contextLoading: v }),
})
