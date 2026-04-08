'use client'

import dynamic from 'next/dynamic'

const StoryVibeCanvas = dynamic(
  () => import('@/components/canvas/StoryVibeCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando canvas...</p>
        </div>
      </div>
    ),
  }
)

export default function CanvasPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <StoryVibeCanvas />
    </div>
  )
}
