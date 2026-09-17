import { Move, RotateCw, MousePointer2, Scale } from 'lucide-react'
import { useEditorStore, type ToolId } from '../../store/useEditorStore'

const TOOLS: { id: ToolId; label: string; icon: typeof Move }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'translate', label: 'Translate', icon: Move },
  { id: 'rotate', label: 'Rotate', icon: RotateCw },
  { id: 'scale', label: 'Scale', icon: Scale },
]

export function Toolbar() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)

  return (
    <div className="flex gap-1 rounded-lg bg-neutral-900/90 p-1.5 shadow-lg">
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
  )
}
