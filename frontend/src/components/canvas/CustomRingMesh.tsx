import { useMemo } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '../../store/useEditorStore'

export function CustomRingMesh() {
  const ringGeometry = useEditorStore((state) => state.ringGeometry)

  const geometry = useMemo(() => {
    if (!ringGeometry) return null

    const positions = new Float32Array(ringGeometry.vertices.flat())
    const flatFaces = ringGeometry.faces.flat()
    const indices =
      positions.length / 3 > 65535
        ? new Uint32Array(flatFaces)
        : new Uint16Array(flatFaces)

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setIndex(new THREE.BufferAttribute(indices, 1))
    geom.computeVertexNormals()

    return geom
  }, [ringGeometry])

  if (!geometry) return null

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
    </mesh>
  )
}
