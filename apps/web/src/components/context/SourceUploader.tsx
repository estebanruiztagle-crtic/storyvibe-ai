'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Image, Music, Film, X, Check } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface SourceFile {
  id: string
  type: 'image' | 'audio' | 'video' | 'text'
  name: string
  size: number
  preview?: string
  transcription?: string
  description?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

interface Props {
  projectId: string
  sources: SourceFile[]
  onSourcesChange: React.Dispatch<React.SetStateAction<SourceFile[]>>
}

const ICON_MAP = { image: Image, audio: Music, video: Film, text: FileText }

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function SourceUploader({ projectId, sources, onSourcesChange }: Props) {
  const [textInput, setTextInput] = useState('')
  const [textAdded, setTextAdded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const detectType = (name: string): SourceFile['type'] => {
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio'
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video'
    return 'text'
  }

  const processFile = async (file: File, id: string) => {
    onSourcesChange((p) => p.map((s) => s.id === id ? { ...s, status: 'processing' } : s))
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result as string)
        r.onerror = rej
        r.readAsDataURL(file)
      })

      const type = detectType(file.name)
      if (type === 'image') {
        onSourcesChange((p) => p.map((s) => s.id === id ? { ...s, preview: dataUrl } : s))
      }

      const res = await fetch(`${API}/api/v1/zones/zone1/analyze-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentationId: projectId, sourceType: type, fileName: file.name, dataUrl }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        onSourcesChange((p) => p.map((s) => s.id === id ? {
          ...s,
          description: data.description,
          transcription: data.transcription,
          status: 'done',
        } : s))
      } else {
        onSourcesChange((p) => p.map((s) => s.id === id ? { ...s, status: 'error', error: data.error ?? 'Error' } : s))
      }
    } catch (err) {
      onSourcesChange((p) => p.map((s) => s.id === id ? { ...s, status: 'error', error: String(err) } : s))
    }
  }

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files)
    const newSources: SourceFile[] = arr.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: detectType(f.name),
      name: f.name,
      size: f.size,
      status: 'pending',
    }))
    onSourcesChange((p) => [...p, ...newSources])
    arr.forEach((f, i) => processFile(f, newSources[i].id))
  }

  const addText = () => {
    if (!textInput.trim()) return
    onSourcesChange((p) => [...p, {
      id: `txt-${Date.now()}`,
      type: 'text',
      name: 'Texto directo',
      size: textInput.length,
      description: textInput.trim(),
      status: 'done',
    }])
    setTextInput('')
    setTextAdded(true)
    setTimeout(() => setTextAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
      >
        <Upload size={24} className="text-neutral-400" />
        <div className="text-center">
          <div className="text-sm font-semibold text-neutral-700">Arrastra archivos o haz clic</div>
          <div className="mt-1 text-[11px] text-neutral-400">Imágenes · Audio · Video · Documentos</div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Text input */}
      <div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          O pega texto / URL
        </div>
        <div className="flex gap-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Pega aquí texto, notas, un brief o cualquier contexto…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-neutral-400"
          />
          <button
            onClick={addText}
            disabled={!textInput.trim()}
            className="self-end rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-30"
          >
            {textAdded ? <Check size={14} /> : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Source list */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {sources.length} fuente{sources.length !== 1 ? 's' : ''}
          </div>
          {sources.map((src) => {
            const Icon = ICON_MAP[src.type]
            return (
              <div key={src.id} className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-white p-3">
                {src.preview ? (
                  <img src={src.preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-50">
                    <Icon size={16} className="text-neutral-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs font-semibold text-neutral-800">{src.name}</span>
                    <button onClick={() => onSourcesChange((p) => p.filter((s) => s.id !== src.id))} className="text-neutral-300 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                    <span className={
                      src.status === 'done' ? 'text-emerald-600' :
                      src.status === 'processing' ? 'text-amber-500' :
                      src.status === 'error' ? 'text-red-500' : 'text-neutral-400'
                    }>
                      {src.status === 'done' ? '✓ listo' : src.status === 'processing' ? '⏳ procesando' : src.status === 'error' ? '✗ error' : 'pendiente'}
                    </span>
                    {src.size > 0 && <span className="text-neutral-300">{fmtSize(src.size)}</span>}
                  </div>
                  {(src.description || src.transcription) && (
                    <div className="mt-1.5 rounded-lg bg-neutral-50 px-2 py-1 text-[11px] text-neutral-500 line-clamp-2">
                      {src.description ?? src.transcription}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
