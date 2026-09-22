import { useEffect } from 'react'
import { Move, RotateCw, MousePointer2, Scale } from 'lucide-react'
import { useEditorWebSocket } from '../../hooks/useEditorWebSocket'
import { useEditorStore, type ToolId } from '../../store/useEditorStore'
import type { ExportRingRequest } from '../../types/api-specs'

const TOOLS: { id: ToolId; label: string; icon: typeof Move }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'translate', label: 'Translate', icon: Move },
  { id: 'rotate', label: 'Rotate', icon: RotateCw },
  { id: 'scale', label: 'Scale', icon: Scale },
]

const DEBOUNCE_MS = 100

export function Toolbar() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const ringRadius = useEditorStore((state) => state.ringRadius)
  const ringThickness = useEditorStore((state) => state.ringThickness)
  const setRingRadius = useEditorStore((state) => state.setRingRadius)
  const setRingThickness = useEditorStore((state) => state.setRingThickness)
  const hasGemstone = useEditorStore((state) => state.hasGemstone)
  const gemstoneSize = useEditorStore((state) => state.gemstoneSize)
  const setHasGemstone = useEditorStore((state) => state.setHasGemstone)
  const setGemstoneSize = useEditorStore((state) => state.setGemstoneSize)
  const { requestRing, isConnected } = useEditorWebSocket()

  useEffect(() => {
    if (!isConnected) return

    const timeout = setTimeout(() => {
      requestRing(ringRadius, ringThickness, hasGemstone, gemstoneSize)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [ringRadius, ringThickness, hasGemstone, gemstoneSize, isConnected, requestRing])

  const handleExportStl = async () => {
    const payload: ExportRingRequest = {
      radius: ringRadius,
      thickness: ringThickness,
    }

    const response = await fetch('http://localhost:8000/api/export/stl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ring.stl'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-4 rounded-lg bg-neutral-900/90 p-3 shadow-lg">
      <div className="flex gap-1">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setActiveTool(id)}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              activeTool === id
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>

      <div className="h-8 w-px bg-neutral-700" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-300">
          <label htmlFor="ring-radius">Radius</label>
          <span className="tabular-nums text-neutral-400">
            {ringRadius.toFixed(1)}
          </span>
        </div>
        <input
          id="ring-radius"
          type="range"
          min={5}
          max={20}
          step={0.5}
          value={ringRadius}
          onChange={(event) => setRingRadius(Number(event.target.value))}
          className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-amber-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-300">
          <label htmlFor="ring-thickness">Thickness</label>
          <span className="tabular-nums text-neutral-400">
            {ringThickness.toFixed(1)}
          </span>
        </div>
        <input
          id="ring-thickness"
          type="range"
          min={0.5}
          max={5}
          step={0.1}
          value={ringThickness}
          onChange={(event) => setRingThickness(Number(event.target.value))}
          className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-amber-500"
        />
      </div>

      <div className="h-8 w-px bg-neutral-700" />

      <label
        htmlFor="has-gemstone"
        className="flex items-center gap-2 text-xs text-neutral-300"
      >
        <input
          id="has-gemstone"
          type="checkbox"
          checked={hasGemstone}
          onChange={(event) => setHasGemstone(event.target.checked)}
          className="h-4 w-4 cursor-pointer accent-amber-500"
        />
        Gemstone
      </label>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-300">
          <label htmlFor="gemstone-size">Size</label>
          <span className="tabular-nums text-neutral-400">
            {gemstoneSize.toFixed(1)}
          </span>
        </div>
        <input
          id="gemstone-size"
          type="range"
          min={0.5}
          max={5}
          step={0.1}
          value={gemstoneSize}
          disabled={!hasGemstone}
          onChange={(event) => setGemstoneSize(Number(event.target.value))}
          className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>

      <div className="h-8 w-px bg-neutral-700" />

      <button
        type="button"
        onClick={handleExportStl}
        className="h-9 rounded-md bg-amber-500 px-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-400"
      >
        Export to STL
      </button>
    </div>
  )
}
