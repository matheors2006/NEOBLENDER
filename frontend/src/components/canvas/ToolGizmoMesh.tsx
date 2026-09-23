import { useMemo, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore } from '../../store/useEditorStore'
import { createToolGeometry } from '../../utils/toolGeometry'

export function ToolGizmoMesh() {
  const toolGizmo = useEditorStore((state) => state.toolGizmo)
  const updateToolGizmoMatrix = useEditorStore(
    (state) => state.updateToolGizmoMatrix,
  )
  const meshRef = useRef<THREE.Mesh>(null)

  const type = toolGizmo?.type
  const geometry = useMemo(() => (type ? createToolGeometry(type) : null), [type])

  if (!geometry) return null

  const handleObjectChange = () => {
    const mesh = meshRef.current
    if (!mesh) return
    // TransformControls moves the wrapping group; refresh the chain so the
    // world matrix reflects the drag that just happened.
    mesh.updateWorldMatrix(true, false)
    updateToolGizmoMatrix(mesh.matrixWorld.toArray())
  }

  return (
    <TransformControls mode="translate" onObjectChange={handleObjectChange}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color="#ef4444"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </TransformControls>
  )
}
