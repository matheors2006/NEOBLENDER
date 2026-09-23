import { create } from 'zustand'
import type { CompositeRingGeometry, GeometryData } from '../types/api-specs'

export type ToolId = 'select' | 'translate' | 'rotate' | 'scale'
export type EditorMode = 'parametric' | 'sculpt'
export type ToolGizmoType = 'cylinder' | 'sphere'

export interface ToolGizmo {
  type: ToolGizmoType
  matrix: number[]
}

interface EditorState {
  activeTool: ToolId
  selectedMesh: string | null
  ringGeometry: CompositeRingGeometry | null
  ringRadius: number
  ringThickness: number
  hasGemstone: boolean
  gemstoneSize: number
  editorMode: EditorMode
  isSculpting: boolean
  toolGizmo: ToolGizmo | null
  setActiveTool: (tool: ToolId) => void
  setSelectedMesh: (meshId: string | null) => void
  setRingGeometry: (geometry: CompositeRingGeometry | null) => void
  setRingRadius: (radius: number) => void
  setRingThickness: (thickness: number) => void
  setHasGemstone: (hasGemstone: boolean) => void
  setGemstoneSize: (gemstoneSize: number) => void
  setEditorMode: (mode: EditorMode) => void
  setIsSculpting: (isSculpting: boolean) => void
  updateRingGeometryVertices: (newVertices: number[]) => void
  updateRingMesh: (ring: GeometryData) => void
  setToolGizmo: (gizmo: ToolGizmo | null) => void
  updateToolGizmoMatrix: (matrix: number[]) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedMesh: null,
  ringGeometry: null,
  ringRadius: 10,
  ringThickness: 2,
  hasGemstone: false,
  gemstoneSize: 2,
  editorMode: 'parametric',
  isSculpting: false,
  toolGizmo: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedMesh: (meshId) => set({ selectedMesh: meshId }),
  setRingGeometry: (geometry) => set({ ringGeometry: geometry }),
  setRingRadius: (radius) => set({ ringRadius: radius }),
  setRingThickness: (thickness) => set({ ringThickness: thickness }),
  setHasGemstone: (hasGemstone) => set({ hasGemstone }),
  setGemstoneSize: (gemstoneSize) => set({ gemstoneSize }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setIsSculpting: (isSculpting) => set({ isSculpting }),
  updateRingGeometryVertices: (newVertices) =>
    set((state) => {
      if (!state.ringGeometry) return state

      const nestedVertices: number[][] = []
      for (let i = 0; i < newVertices.length; i += 3) {
        nestedVertices.push([
          newVertices[i],
          newVertices[i + 1],
          newVertices[i + 2],
        ])
      }

      return {
        ringGeometry: {
          ...state.ringGeometry,
          ring: {
            ...state.ringGeometry.ring,
            vertices: nestedVertices,
          },
        },
      }
    }),
  updateRingMesh: (ring) =>
    set((state) => ({
      ringGeometry: {
        ring,
        gemstone: state.ringGeometry?.gemstone ?? null,
      },
    })),
  setToolGizmo: (gizmo) => set({ toolGizmo: gizmo }),
  updateToolGizmoMatrix: (matrix) =>
    set((state) =>
      state.toolGizmo ? { toolGizmo: { ...state.toolGizmo, matrix } } : state,
    ),
}))
