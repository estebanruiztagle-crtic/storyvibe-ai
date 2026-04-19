// Slice: Zone 4 — Evaluación + Redesign
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

export interface SlideRedesign {
  slide: number
  label: string
  currentScore: number
  projectedScore: number
  changes: {
    type?: 'peak' | 'valley' | 'transition'
    emotion?: string
    intensity?: number
    suggestedTitle?: string
    contentDirection?: string
    designStyle?: string
    visualMood?: string
  }
  rationale: string
  accepted: boolean
}

export interface RedesignResult {
  redesignedCurvePoints: Array<{
    slide: number
    label: string
    type: 'peak' | 'valley' | 'transition'
    emotion: string
    intensity: number
    suggestedTitle?: string
    contentDirection?: string
    designStyle?: string
    visualMood?: string
    [key: string]: unknown
  }>
  slideRedesigns: SlideRedesign[]
  narrativeSummary: string
  globalImprovementScore: number
  mainIssues: string[]
}

export interface ReviewSlice {
  review: ReviewResult | null
  reviewLoading: boolean
  redesign: RedesignResult | null
  redesignLoading: boolean
  redesignApplied: boolean
  setReview: (r: ReviewResult) => void
  clearReview: () => void
  setReviewLoading: (v: boolean) => void
  setRedesign: (r: RedesignResult) => void
  clearRedesign: () => void
  setRedesignLoading: (v: boolean) => void
  toggleRedesignAccepted: (slide: number) => void
  acceptAllRedesigns: () => void
  setRedesignApplied: (v: boolean) => void
}

export const createReviewSlice: StateCreator<ReviewSlice> = (set) => ({
  review: null,
  reviewLoading: false,
  redesign: null,
  redesignLoading: false,
  redesignApplied: false,

  setReview: (r) => set({ review: r }),
  clearReview: () => set({ review: null }),
  setReviewLoading: (v) => set({ reviewLoading: v }),

  setRedesign: (r) => set({ redesign: r, redesignApplied: false }),
  clearRedesign: () => set({ redesign: null, redesignApplied: false }),
  setRedesignLoading: (v) => set({ redesignLoading: v }),

  toggleRedesignAccepted: (slide) =>
    set((s) => {
      if (!s.redesign) return s
      return {
        redesign: {
          ...s.redesign,
          slideRedesigns: s.redesign.slideRedesigns.map((r) =>
            r.slide === slide ? { ...r, accepted: !r.accepted } : r
          ),
        },
      }
    }),

  acceptAllRedesigns: () =>
    set((s) => {
      if (!s.redesign) return s
      return {
        redesign: {
          ...s.redesign,
          slideRedesigns: s.redesign.slideRedesigns.map((r) => ({ ...r, accepted: true })),
        },
      }
    }),

  setRedesignApplied: (v) => set({ redesignApplied: v }),
})
