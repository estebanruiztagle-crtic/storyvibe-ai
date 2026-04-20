import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createContextSlice, type ContextSlice } from './slices/context'
import { createNarrativeSlice, type NarrativeSlice } from './slices/narrative'
import { createDesignSlice, type DesignSlice } from './slices/design'
import { createReviewSlice, type ReviewSlice } from './slices/review'

export type AppStore = ContextSlice & NarrativeSlice & DesignSlice & ReviewSlice & {
  resetProject: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createContextSlice(set, get, api),
      ...createNarrativeSlice(set, get, api),
      ...createDesignSlice(set, get, api),
      ...createReviewSlice(set, get, api),
      resetProject: () => {
        get().clearContext()
        get().clearNarrative()
        get().clearDesign()
        get().clearReview()
        get().clearRedesign()
        set({ presentationTitle: '', redesignApplied: false })
      },
    }),
    {
      name: 'storyvibe-project',
      storage: createJSONStorage(() => localStorage),
      // Only persist data, not loading flags or functions
      partialize: (state) => ({
        context: state.context,
        narrative: state.narrative,
        design: state.design,
        presentationTitle: state.presentationTitle,
        review: state.review,
        redesign: state.redesign,
        redesignApplied: state.redesignApplied,
      }),
    }
  )
)
