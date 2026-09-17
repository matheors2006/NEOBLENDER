import { create } from 'zustand'

export type ToolId = 'select' | 'translate' | 'rotate' | 'scale'

interface EditorState {
  activeTool: ToolId
  selectedNodeId: string | null
  setActiveTool: (tool: ToolId) => void
  setSelectedNodeId: (nodeId: string | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedNodeId: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
}))
