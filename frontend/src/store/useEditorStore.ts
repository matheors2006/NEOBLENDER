import { create } from 'zustand'
import type { CompositeRingGeometry } from '../types/api-specs'

export type ToolId = 'select' | 'translate' | 'rotate' | 'scale'

interface EditorState {
  activeTool: ToolId
  selectedMesh: string | null
  ringGeometry: CompositeRingGeometry | null
  ringRadius: number
  ringThickness: number
  hasGemstone: boolean
  gemstoneSize: number
  setActiveTool: (tool: ToolId) => void
  setSelectedMesh: (meshId: string | null) => void
  setRingGeometry: (geometry: CompositeRingGeometry | null) => void
  setRingRadius: (radius: number) => void
  setRingThickness: (thickness: number) => void
  setHasGemstone: (hasGemstone: boolean) => void
  setGemstoneSize: (gemstoneSize: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedMesh: null,
  ringGeometry: null,
  ringRadius: 10,
  ringThickness: 2,
  hasGemstone: false,
  gemstoneSize: 2,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedMesh: (meshId) => set({ selectedMesh: meshId }),
  setRingGeometry: (geometry) => set({ ringGeometry: geometry }),
  setRingRadius: (radius) => set({ ringRadius: radius }),
  setRingThickness: (thickness) => set({ ringThickness: thickness }),
  setHasGemstone: (hasGemstone) => set({ hasGemstone }),
  setGemstoneSize: (gemstoneSize) => set({ gemstoneSize }),
}))
