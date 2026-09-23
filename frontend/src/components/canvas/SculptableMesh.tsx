import { useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '../../store/useEditorStore'
import type { GeometryData } from '../../types/api-specs'

const BRUSH_RADIUS = 2.0
const BRUSH_STRENGTH = 0.5

interface SculptableMeshProps {
  geometryData: GeometryData
}

export function SculptableMesh({ geometryData }: SculptableMeshProps) {
  const isSculptingRef = useRef(false)
  const setIsSculpting = useEditorStore((state) => state.setIsSculpting)
  const updateRingGeometryVertices = useEditorStore(
    (state) => state.updateRingGeometryVertices,
  )

  const geometry = useMemo(() => {
    const positions = new Float32Array(geometryData.vertices.flat())
    const flatFaces = geometryData.faces.flat()
    const indices =
      positions.length / 3 > 65535
        ? new Uint32Array(flatFaces)
        : new Uint16Array(flatFaces)

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setIndex(new THREE.BufferAttribute(indices, 1))
    geom.computeVertexNormals()

    return geom
  }, [geometryData])

  // The mesh carries no transform of its own, so the raycaster's world-space
  // intersection point lines up directly with the geometry's local vertex
  // positions below.
  const applyBrush = (point: THREE.Vector3) => {
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute
    const normalAttr = geometry.attributes.normal as THREE.BufferAttribute
    const vertex = new THREE.Vector3()
    const normal = new THREE.Vector3()

    for (let i = 0; i < positionAttr.count; i++) {
      vertex.fromBufferAttribute(positionAttr, i)

      const distance = vertex.distanceTo(point)

      // The radius guard is required: squaring makes the falloff positive again
      // beyond the brush radius.
      if (distance <= BRUSH_RADIUS) {
        const weight = Math.max(0, Math.pow(1 - distance / BRUSH_RADIUS, 2))
        normal.fromBufferAttribute(normalAttr, i)
        vertex.addScaledVector(normal, BRUSH_STRENGTH * weight)
        positionAttr.setXYZ(i, vertex.x, vertex.y, vertex.z)
      }
    }

    positionAttr.needsUpdate = true
    geometry.computeVertexNormals()
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    isSculptingRef.current = true
    setIsSculpting(true)
    applyBrush(event.point)
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isSculptingRef.current) return
    event.stopPropagation()
    applyBrush(event.point)
  }

  const persistVertices = () => {
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute
    updateRingGeometryVertices(Array.from(positionAttr.array))
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    isSculptingRef.current = false
    setIsSculpting(false)
    persistVertices()
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    isSculptingRef.current = false
    setIsSculpting(false)
  }

  return (
    <mesh
      geometry={geometry}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerOut}
    >
      <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
    </mesh>
  )
}
