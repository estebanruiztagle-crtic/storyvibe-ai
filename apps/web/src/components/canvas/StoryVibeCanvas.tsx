'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from 'tldraw'
import type { Zone1Context } from '../zones/zone1/types'
import { EMPTY_ZONE1_CONTEXT } from '../zones/zone1/types'
import type { Zone2State } from '../zones/zone2/types'
import { EMPTY_ZONE2 } from '../zones/zone2/types'
import { Tldraw, useEditor, type TLShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { zone1ShapeUtil } from './shapes/Zone1Shape'
import { Zone2AShapeUtil } from './shapes/Zone2AShape'
import { Zone2BShapeUtil } from './shapes/Zone2BShape'
import { EmotionalCurveShapeUtil } from './shapes/EmotionalCurveShape'
import { Zone3ShapeUtil } from './shapes/Zone3Shape'
import { ZonePanelProvider, useZonePanel } from '@/lib/zone-panel-context'
import Zone1Panel from '../zones/zone1/Zone1Panel'
import Zone2Panel from '../zones/zone2/Zone2Panel'
import Zone3Panel from '../zones/zone3/Zone3Panel'
import type { TLZone1Shape } from './shapes/Zone1Shape'
import type { TLZone2AShape } from './shapes/Zone2AShape'
import type { TLZone2BShape } from './shapes/Zone2BShape'
import type { TLZone3Shape } from './shapes/Zone3Shape'
import type { Zone3State } from '../zones/zone3/types'
import { EMPTY_ZONE3 } from '../zones/zone3/types'

// ─── Editor context ───────────────────────────────────────────────────────────
// Captures the tldraw editor instance so components outside <Tldraw> can use it
const TldrawEditorContext = createContext<{ editor: Editor | null }>({ editor: null })

function useTldrawEditor() {
  return useContext(TldrawEditorContext).editor
}

// ─── EditorCapture — rendered inside <Tldraw>, stores the editor in context ──
function EditorCapture({ onEditor }: { onEditor: (e: Editor) => void }) {
  const editor = useEditor()
  useEffect(() => { onEditor(editor) }, [editor, onEditor])
  return null
}

const customShapeUtils = [
  zone1ShapeUtil,
  Zone2AShapeUtil,
  Zone2BShapeUtil,
  EmotionalCurveShapeUtil,
  Zone3ShapeUtil,
]

// ─── PanelOverlay — rendered OUTSIDE <Tldraw>, reads editor from context ─────
function PanelOverlay() {
  const editor = useTldrawEditor()
  const { panel, openPanel, closePanel } = useZonePanel()

  if (!editor || !panel.shapeId || !panel.type) return null

  const shape = editor.getShape(panel.shapeId as TLShapeId)
  if (!shape) return null

  // ── Zone 1 ──────────────────────────────────────────────────────────────────
  if (panel.type === 'zone1') {
    const z1Shape = shape as TLZone1Shape
    const initialContext: Zone1Context = z1Shape.props.contextJson
      ? (() => {
          try { return JSON.parse(z1Shape.props.contextJson) as Zone1Context }
          catch { return EMPTY_ZONE1_CONTEXT }
        })()
      : EMPTY_ZONE1_CONTEXT

    const handleContextUpdate = (context: Zone1Context, completeness: number) => {
      editor.updateShape<TLZone1Shape>({
        id: z1Shape.id,
        type: 'zone1',
        props: {
          contextJson: JSON.stringify(context),
          completeness,
          status: completeness >= 80 ? 'validated' : 'in_progress',
        },
      })
    }

    // Creates Zone 2A on canvas (if not yet) and opens its panel
    const handleAdvanceToZone2 = () => {
      editor.run(() => {
        const shapes = editor.getCurrentPageShapes()
        const z1 = shapes.find((s) => s.type === 'zone1')
        if (!shapes.some((s) => s.type === 'zone2a') && z1) {
          const x2a = z1.x + (z1.props as { w: number }).w + 40
          editor.createShape<TLZone2AShape>({
            type: 'zone2a', x: x2a, y: z1.y,
            props: { w: 640, h: 340, presentationId: 'default', status: 'empty', selectedCount: 0, totalCount: 0, mandatoryCount: 0, patternConfidence: 0, contractReady: false, dataJson: '' },
          })
          editor.zoomToFit({ animation: { duration: 500 } })
        }
      }, { history: 'ignore' })
      const z2a = editor.getCurrentPageShapes().find((s) => s.type === 'zone2a') as TLZone2AShape | undefined
      if (z2a) openPanel('zone2', z2a.id)
    }

    return (
      <Zone1Panel
        shapeId={panel.shapeId}
        initialContext={initialContext}
        onContextUpdate={handleContextUpdate}
        onClose={closePanel}
        onAdvanceToZone2={handleAdvanceToZone2}
      />
    )
  }

  // ── Zone 2 ───────────────────────────────────────────────────────────────────
  if (panel.type === 'zone2') {
    const z2Shape = shape as TLZone2AShape | TLZone2BShape
    const dataJson = (z2Shape.props as { dataJson?: string }).dataJson ?? ''
    const initialState: Zone2State = dataJson
      ? (() => { try { return JSON.parse(dataJson) as Zone2State } catch { return EMPTY_ZONE2 } })()
      : EMPTY_ZONE2

    const allShapes = editor.getCurrentPageShapes()
    const z1Shape = allShapes.find((s) => s.type === 'zone1') as TLZone1Shape | undefined
    const z2aShape = allShapes.find((s) => s.type === 'zone2a') as TLZone2AShape | undefined
    const z2bShape = allShapes.find((s) => s.type === 'zone2b') as TLZone2BShape | undefined

    const handleStateUpdate = (newState: Zone2State) => {
      const wasCurveApproved = (() => {
        try { return z2aShape?.props.dataJson ? (JSON.parse(z2aShape.props.dataJson) as Zone2State).curveStatus === 'approved' : false }
        catch { return false }
      })()
      const selectedCount = newState.topics.filter((t) => t.selected).length
      const totalCount = newState.topics.length
      const mandatoryCount = newState.topics.filter((t) => t.mandatory).length
      const contractReady = selectedCount >= 4
      const status: 'empty' | 'in_progress' | 'validated' =
        totalCount === 0 ? 'empty' :
        newState.curveStatus === 'approved' ? 'validated' : 'in_progress'
      const serialized = JSON.stringify(newState)
      const selectedFw = newState.frameworks.find((f) => f.id === newState.selectedFrameworkId)
      const fwName = selectedFw?.name ?? ''
      const fwScore = selectedFw?.fitScore ?? 0

      if (z2aShape) {
        editor.updateShape<TLZone2AShape>({
          id: z2aShape.id, type: 'zone2a',
          props: { dataJson: serialized, selectedCount, totalCount, mandatoryCount, patternConfidence: newState.authorPattern.confidence, contractReady, status },
        })
      }
      if (z2bShape) {
        const z2bStatus: TLZone2BShape['props']['status'] =
          newState.curveStatus === 'approved' ? 'curve_approved' :
          newState.curvePoints.length > 0 ? 'curve_generated' :
          selectedFw ? 'framework_selected' : 'empty'
        editor.updateShape<TLZone2BShape>({
          id: z2bShape.id, type: 'zone2b',
          props: { dataJson: serialized, status: z2bStatus, selectedFrameworkName: fwName, selectedFrameworkFitScore: fwScore, curvePointCount: newState.curvePoints.length },
        })
      }
      if (!wasCurveApproved && newState.curveStatus === 'approved') {
        setTimeout(() => {
          editor.run(() => {
            const shapes = editor.getCurrentPageShapes()
            const z2b = shapes.find((s) => s.type === 'zone2b')
            const z2a = shapes.find((s) => s.type === 'zone2a')
            const anchor = z2b ?? z2a
            if (!shapes.some((s) => s.type === 'zone3') && anchor) {
              editor.createShape<TLZone3Shape>({
                type: 'zone3',
                x: anchor.x + (anchor.props as { w: number }).w + 40,
                y: anchor.y,
                props: { w: 700, h: 360, presentationId: 'default', status: 'empty', approvedCount: 0, totalSlots: newState.curvePoints.length, dataJson: '' },
              })
              editor.zoomToFit({ animation: { duration: 500 } })
            }
          }, { history: 'ignore' })
          const z3Shape = editor.getCurrentPageShapes().find((s) => s.type === 'zone3') as TLZone3Shape | undefined
          if (z3Shape) openPanel('zone3', z3Shape.id)
        }, 400)
      }
    }

    return (
      <Zone2Panel
        shapeId={panel.shapeId}
        initialState={initialState}
        zone1ContextJson={z1Shape?.props.contextJson ?? ''}
        onStateUpdate={handleStateUpdate}
        onClose={closePanel}
      />
    )
  }

  // ── Zone 3 (Diseño visual + Recraft) ────────────────────────────────────────
  if (panel.type === 'zone3') {
    const z3Shape = shape as TLZone3Shape
    const initialState: Zone3State = z3Shape.props.dataJson
      ? (() => { try { return JSON.parse(z3Shape.props.dataJson) as Zone3State } catch { return EMPTY_ZONE3 } })()
      : EMPTY_ZONE3

    const allShapes    = editor.getCurrentPageShapes()
    const z1Shape      = allShapes.find((s) => s.type === 'zone1') as TLZone1Shape | undefined
    const z2aShape     = allShapes.find((s) => s.type === 'zone2a') as TLZone2AShape | undefined

    // Extract curvePoints from Zone2 state to pass as JSON
    let curvePointsJson: string | undefined
    if (z2aShape?.props.dataJson) {
      try {
        const z2State = JSON.parse(z2aShape.props.dataJson) as Zone2State
        if (z2State.curvePoints?.length > 0) {
          curvePointsJson = JSON.stringify(z2State.curvePoints)
        }
      } catch { /* ignore */ }
    }

    const handleStateUpdate = (newState: Zone3State) => {
      const approvedCount = newState.slides.filter((s) => s.approved).length
      const allApproved   = newState.slides.length > 0 && approvedCount === newState.slides.length
      editor.updateShape<TLZone3Shape>({
        id: z3Shape.id, type: 'zone3',
        props: {
          dataJson:     JSON.stringify(newState),
          status:       allApproved ? 'completed' : approvedCount > 0 || newState.paletteGenerated ? 'in_progress' : 'empty',
          approvedCount,
          totalSlots:   newState.slides.length,
        },
      })
    }

    // When a title is generated, update Zone1 shape's presentationName
    const handleTitleUpdate = (newTitle: string) => {
      if (!z1Shape) return
      try {
        const ctx = z1Shape.props.contextJson
          ? JSON.parse(z1Shape.props.contextJson) as Zone1Context
          : EMPTY_ZONE1_CONTEXT
        editor.updateShape<TLZone1Shape>({
          id: z1Shape.id, type: 'zone1',
          props: { contextJson: JSON.stringify({ ...ctx, presentationName: newTitle }) },
        })
      } catch { /* ignore */ }
    }

    return (
      <Zone3Panel
        shapeId={panel.shapeId}
        initialState={initialState}
        zone1ContextJson={z1Shape?.props.contextJson ?? ''}
        curvePointsJson={curvePointsJson}
        zone2DataJson={z2aShape?.props.dataJson ?? ''}
        onStateUpdate={handleStateUpdate}
        onTitleUpdate={handleTitleUpdate}
        onClose={closePanel}
      />
    )
  }

  return null
}

// ─── ResetButton — fixed portal button in bottom-left corner ─────────────────
function ResetButton() {
  const editor = useTldrawEditor()
  const { closePanel } = useZonePanel()
  const [confirming, setConfirming] = useState(false)

  if (!editor) return null

  const handleReset = () => {
    closePanel()
    editor.run(() => {
      const allIds = editor.getCurrentPageShapes().map((s) => s.id)
      if (allIds.length > 0) editor.deleteShapes(allIds)
      // Canvas is now empty — user must click 🎬 to start a new Acto #1
    }, { history: 'ignore' })
    setConfirming(false)
  }

  return createPortal(
    <div
      style={{
        position:   'fixed',
        bottom:     24,
        left:       24,
        zIndex:     9997,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {confirming ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border:          '1.5px solid #E5E2DA',
            borderRadius:    10,
            padding:         '12px 14px',
            boxShadow:       '0 4px 16px rgba(0,0,0,0.10)',
            display:         'flex',
            flexDirection:   'column',
            gap:             10,
            minWidth:        210,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#1A1A18', fontWeight: 600, lineHeight: 1.4 }}>
            ¿Reiniciar todo el canvas?
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#9B9895', lineHeight: 1.4 }}>
            Se eliminarán todas las zonas y el progreso. Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleReset}
              style={{
                flex:            1,
                padding:         '7px 0',
                backgroundColor: '#E24B4A',
                color:           '#fff',
                border:          'none',
                borderRadius:    6,
                fontSize:        11,
                fontWeight:      600,
                cursor:          'pointer',
                fontFamily:      "'Inter', sans-serif",
              }}
            >
              Sí, reiniciar
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                flex:            1,
                padding:         '7px 0',
                backgroundColor: '#F1EFE8',
                color:           '#444441',
                border:          '1px solid #D1CCBF',
                borderRadius:    6,
                fontSize:        11,
                fontWeight:      600,
                cursor:          'pointer',
                fontFamily:      "'Inter', sans-serif",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '7px 13px',
            backgroundColor: '#FFFFFF',
            color:           '#6B6866',
            border:          '1.5px solid #D1CCBF',
            borderRadius:    8,
            fontSize:        11,
            fontWeight:      600,
            cursor:          'pointer',
            fontFamily:      "'Inter', sans-serif",
            boxShadow:       '0 1px 4px rgba(0,0,0,0.07)',
            transition:      'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9F8F5' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v4h4" />
            <path d="M1.5 8A6.5 6.5 0 1 0 3 3.5" />
          </svg>
          Reiniciar canvas
        </button>
      )}
    </div>,
    document.body
  )
}

// ─── CanvasInitializer — no longer auto-creates Zone1; canvas starts empty ─────
function CanvasInitializer() {
  // Nothing to do — the empty canvas overlay handles first-time setup
  return null
}

// ─── CanvasAutoFlow — disabled; user must click clapperboard to start ─────────
function CanvasAutoFlow({ editor: _editor }: { editor: Editor | null }) {
  // Auto-open removed — user clicks 🎬 to begin
  return null
}


// ─── EmptyCanvasOverlay — shown when no zone1 exists yet ─────────────────────
function EmptyCanvasOverlay({ editor }: { editor: Editor | null }) {
  const { openPanel } = useZonePanel()
  const [hasShapes, setHasShapes] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!editor) return
    const check = () => {
      const shapes = editor.getCurrentPageShapes()
      setHasShapes(shapes.some((s) => s.type === 'zone1'))
    }
    check()
    const cleanup = editor.store.listen(check, { source: 'all', scope: 'all' })
    return () => { cleanup() }
  }, [editor])

  if (!editor || hasShapes) return null

  const handleClick = () => {
    editor.run(() => {
      const shapes = editor.getCurrentPageShapes()
      if (!shapes.some((s) => s.type === 'zone1')) {
        editor.createShape<TLZone1Shape>({
          type: 'zone1', x: 80, y: 80,
          props: { w: 640, h: 340, presentationId: 'default', status: 'empty', completeness: 0, contextJson: '' },
        })
        editor.zoomToFit({ animation: { duration: 400 } })
      }
    }, { history: 'ignore' })
    setTimeout(() => {
      const zone1 = editor.getCurrentPageShapes().find((s) => s.type === 'zone1')
      if (zone1) openPanel('zone1', zone1.id)
    }, 300)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ textAlign: 'center', pointerEvents: 'all' }}>
        {/* Clapperboard button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'transform 0.2s ease',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
          }}
        >
          <div style={{
            width: 100, height: 100, borderRadius: 24,
            backgroundColor: '#1A1918',
            border: `2px solid ${hovered ? '#EF9F27' : '#2E2C28'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48,
            boxShadow: hovered
              ? '0 0 0 4px rgba(239,159,39,0.15), 0 20px 60px rgba(0,0,0,0.5)'
              : '0 8px 40px rgba(0,0,0,0.3)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            🎬
          </div>

          <div>
            <div style={{
              fontSize: 15, fontWeight: 700, color: '#F5F3EE',
              marginBottom: 4, letterSpacing: '-0.01em',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              Comenzar Acto #1
            </div>
            <div style={{
              fontSize: 12, color: '#6B6866',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              Haz clic para iniciar el diagnóstico
            </div>
          </div>
        </button>

        {/* Keyboard hint */}
        <div style={{
          marginTop: 32, fontSize: 11, color: '#3A3835',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          Canvas listo · Sin presentaciones activas
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function StoryVibeCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const stableSetEditor = useCallback((e: Editor) => setEditor(e), [])

  return (
    <ZonePanelProvider>
      <TldrawEditorContext.Provider value={{ editor }}>
        <div style={{ width: '100%', height: '100%' }} className="storyvibe-canvas-wrapper">
          <Tldraw
            shapeUtils={customShapeUtils}
            persistenceKey="storyvibe-canvas-v2"
          >
            <CanvasInitializer />
            <EditorCapture onEditor={stableSetEditor} />
          </Tldraw>
          <CanvasAutoFlow editor={editor} />
          {/* Portals to body — escape tldraw's CSS transform stacking context */}
          {typeof document !== 'undefined' && createPortal(<PanelOverlay />, document.body)}
          {typeof document !== 'undefined' && <ResetButton />}
          {typeof document !== 'undefined' && <EmptyCanvasOverlay editor={editor} />}
        </div>
      </TldrawEditorContext.Provider>
    </ZonePanelProvider>
  )
}
