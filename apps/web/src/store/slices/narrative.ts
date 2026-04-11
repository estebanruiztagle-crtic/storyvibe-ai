// Slice: Zone 2 — Arquitectura Narrativa
import type { StateCreator } from 'zustand'
import type { Zone2State } from '@/components/zones/zone2/types'
import { EMPTY_ZONE2 } from '@/components/zones/zone2/types'

export interface NarrativeSlice {
  narrative: Zone2State
  narrativeLoading: boolean
  setNarrative: (n: Zone2State) => void
  patchNarrative: (patch: Partial<Zone2State>) => void
  clearNarrative: () => void
  setNarrativeLoading: (v: boolean) => void
}

export const createNarrativeSlice: StateCreator<NarrativeSlice> = (set) => ({
  narrative: EMPTY_ZONE2,
  narrativeLoading: false,
  setNarrative: (n) => set({ narrative: n }),
  patchNarrative: (patch) =>
    set((s) => ({ narrative: { ...s.narrative, ...patch } })),
  clearNarrative: () => set({ narrative: EMPTY_ZONE2 }),
  setNarrativeLoading: (v) => set({ narrativeLoading: v }),
})
