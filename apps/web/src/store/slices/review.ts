// Slice: Zone 4 — Evaluación
import type { StateCreator } from 'zustand'

export interface ReviewResult {
  slideScores: Array<{
    slide: number
    brand: number
    cognitive: number
    emotional: number
    composite: number
    suggestions: string[]
  }>
  overallStatus: 'pass' | 'warning' | 'fail'
}

export interface ReviewSlice {
  review: ReviewResult | null
  reviewLoading: boolean
  setReview: (r: ReviewResult) => void
  clearReview: () => void
  setReviewLoading: (v: boolean) => void
}

export const createReviewSlice: StateCreator<ReviewSlice> = (set) => ({
  review: null,
  reviewLoading: false,
  setReview: (r) => set({ review: r }),
  clearReview: () => set({ review: null }),
  setReviewLoading: (v) => set({ reviewLoading: v }),
})
