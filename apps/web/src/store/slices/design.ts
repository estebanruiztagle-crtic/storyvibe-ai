// Slice: Zone 3 — Diseño Visual
import type { StateCreator } from 'zustand'
import type { Zone3State } from '@/components/zones/zone3/types'
import { EMPTY_ZONE3 } from '@/components/zones/zone3/types'

export interface DesignSlice {
  design: Zone3State
  designLoading: boolean
  presentationTitle: string
  setDesign: (d: Zone3State) => void
  patchDesign: (patch: Partial<Zone3State>) => void
  clearDesign: () => void
  setDesignLoading: (v: boolean) => void
  setPresentationTitle: (t: string) => void
}

export const createDesignSlice: StateCreator<DesignSlice> = (set) => ({
  design: EMPTY_ZONE3,
  designLoading: false,
  presentationTitle: '',
  setDesign: (d) => set({ design: d }),
  patchDesign: (patch) =>
    set((s) => ({ design: { ...s.design, ...patch } })),
  clearDesign: () => set({ design: EMPTY_ZONE3 }),
  setDesignLoading: (v) => set({ designLoading: v }),
  setPresentationTitle: (t) => set({ presentationTitle: t }),
})
