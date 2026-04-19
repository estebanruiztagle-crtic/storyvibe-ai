import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createContextSlice, type ContextSlice } from './slices/context'
import { createNarrativeSlice, type NarrativeSlice } from './slices/narrative'
import { createDesignSlice, type DesignSlice } from './slices/design'
import { createReviewSlice, type ReviewSlice } from './slices/review'

export type AppStore = ContextSlice & NarrativeSlice & DesignSlice & ReviewSlice

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createContextSlice(...a),
      ...createNarrativeSlice(...a),
      ...createDesignSlice(...a),
      ...createReviewSlice(...a),
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
