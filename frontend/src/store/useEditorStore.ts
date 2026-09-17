import { create } from 'zustand'

export type ToolId = 'select' | 'translate' | 'rotate' | 'scale'

interface EditorState {
  activeTool: ToolId
  selectedMesh: string | null
  setActiveTool: (tool: ToolId) => void
  setSelectedMesh: (meshId: string | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedMesh: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedMesh: (meshId) => set({ selectedMesh: meshId }),
}))
