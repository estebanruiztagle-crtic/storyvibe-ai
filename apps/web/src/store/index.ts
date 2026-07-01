import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createContextSlice, type ContextSlice } from './slices/context'
import { createNarrativeSlice, type NarrativeSlice } from './slices/narrative'

export type AppStore = ContextSlice & NarrativeSlice & {
  presentationTitle: string
  setPresentationTitle: (t: string) => void
  resetProject: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createContextSlice(set, get, api),
      ...createNarrativeSlice(set, get, api),
      presentationTitle: '',
      setPresentationTitle: (t) => set({ presentationTitle: t }),
      resetProject: () => {
        get().clearContext()
        get().clearNarrative()
        set({ presentationTitle: '' })
      },
    }),
    {
      name: 'storyvibe-project',
      storage: createJSONStorage(() => localStorage),
      // Only persist data, not loading flags or functions
      partialize: (state) => ({
        context: state.context,
        narrative: state.narrative,
        presentationTitle: state.presentationTitle,
      }),
    }
  )
)
