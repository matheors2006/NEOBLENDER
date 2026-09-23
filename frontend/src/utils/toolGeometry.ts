import * as THREE from 'three'
import type { ToolGizmoType } from '../store/useEditorStore'
import type { GeometryData } from '../types/api-specs'

// Single source of truth so the gizmo the user positions and the geometry sent
// to the boolean engine are always the same shape.
export function createToolGeometry(type: ToolGizmoType): THREE.BufferGeometry {
  switch (type) {
    case 'cylinder':
      return new THREE.CylinderGeometry(1, 1, 20, 16)
    case 'sphere':
      return new THREE.SphereGeometry(2, 32, 16)
  }
}

export function geometryToData(geometry: THREE.BufferGeometry): GeometryData {
  const positions = geometry.attributes.position.array
  const indices = geometry.index!.array

  const vertices: number[][] = []
  for (let i = 0; i < positions.length; i += 3) {
    vertices.push([positions[i], positions[i + 1], positions[i + 2]])
  }

  const faces: number[][] = []
  for (let i = 0; i < indices.length; i += 3) {
    faces.push([indices[i], indices[i + 1], indices[i + 2]])
  }

  return { vertices, faces }
}
