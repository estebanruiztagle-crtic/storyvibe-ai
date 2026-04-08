'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type PanelState = {
  type: 'zone1' | 'zone2' | 'zone2a' | 'zone2b' | 'zone3' | 'zone4' | 'zone5' | 'emotional_curve' | 'act3' | null
  shapeId: string | null
}

type ZonePanelContextValue = {
  panel: PanelState
  openPanel: (type: PanelState['type'], shapeId: string) => void
  closePanel: () => void
}

const ZonePanelContext = createContext<ZonePanelContextValue>({
  panel: { type: null, shapeId: null },
  openPanel: () => {},
  closePanel: () => {},
})

export function ZonePanelProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<PanelState>({ type: null, shapeId: null })
  return (
    <ZonePanelContext.Provider
      value={{
        panel,
        openPanel: (type, shapeId) => setPanel({ type, shapeId }),
        closePanel: () => setPanel({ type: null, shapeId: null }),
      }}
    >
      {children}
    </ZonePanelContext.Provider>
  )
}

export const useZonePanel = () => useContext(ZonePanelContext)
