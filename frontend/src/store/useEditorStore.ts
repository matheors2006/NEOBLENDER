import { create } from 'zustand'

export type ToolId = 'select' | 'translate' | 'rotate' | 'scale'

export interface RingGeometry {
  vertices: number[]
  faces: number[]
}

interface EditorState {
  activeTool: ToolId
  selectedMesh: string | null
  ringGeometry: RingGeometry | null
  setActiveTool: (tool: ToolId) => void
  setSelectedMesh: (meshId: string | null) => void
  setRingGeometry: (geometry: RingGeometry | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedMesh: null,
  ringGeometry: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedMesh: (meshId) => set({ selectedMesh: meshId }),
  setRingGeometry: (geometry) => set({ ringGeometry: geometry }),
}))
