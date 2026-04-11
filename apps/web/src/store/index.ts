import { create } from 'zustand'
import { createContextSlice, type ContextSlice } from './slices/context'
import { createNarrativeSlice, type NarrativeSlice } from './slices/narrative'
import { createDesignSlice, type DesignSlice } from './slices/design'
import { createReviewSlice, type ReviewSlice } from './slices/review'

export type AppStore = ContextSlice & NarrativeSlice & DesignSlice & ReviewSlice

export const useAppStore = create<AppStore>()((...a) => ({
  ...createContextSlice(...a),
  ...createNarrativeSlice(...a),
  ...createDesignSlice(...a),
  ...createReviewSlice(...a),
}))
