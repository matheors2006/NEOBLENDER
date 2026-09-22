import { create } from 'zustand'

export type ToolId = 'select' | 'translate' | 'rotate' | 'scale'

export interface RingGeometry {
  vertices: number[][]
  faces: number[][]
}

interface EditorState {
  activeTool: ToolId
  selectedMesh: string | null
  ringGeometry: RingGeometry | null
  ringRadius: number
  ringThickness: number
  setActiveTool: (tool: ToolId) => void
  setSelectedMesh: (meshId: string | null) => void
  setRingGeometry: (geometry: RingGeometry | null) => void
  setRingRadius: (radius: number) => void
  setRingThickness: (thickness: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedMesh: null,
  ringGeometry: null,
  ringRadius: 10,
  ringThickness: 2,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedMesh: (meshId) => set({ selectedMesh: meshId }),
  setRingGeometry: (geometry) => set({ ringGeometry: geometry }),
  setRingRadius: (radius) => set({ ringRadius: radius }),
  setRingThickness: (thickness) => set({ ringThickness: thickness }),
}))
