import { useMemo } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '../../store/useEditorStore'
import type { GeometryData } from '../../types/api-specs'
import { SculptableMesh } from './SculptableMesh'

function buildBufferGeometry(data: GeometryData): THREE.BufferGeometry {
  const positions = new Float32Array(data.vertices.flat())
  const flatFaces = data.faces.flat()
  const indices =
    positions.length / 3 > 65535
      ? new Uint32Array(flatFaces)
      : new Uint16Array(flatFaces)

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setIndex(new THREE.BufferAttribute(indices, 1))
  geom.computeVertexNormals()

  return geom
}

export function CustomRingMesh() {
  const ringGeometry = useEditorStore((state) => state.ringGeometry)
  const editorMode = useEditorStore((state) => state.editorMode)

  const bandGeometry = useMemo(() => {
    if (!ringGeometry || editorMode === 'sculpt') return null
    return buildBufferGeometry(ringGeometry.ring)
  }, [ringGeometry, editorMode])

  const gemstoneGeometry = useMemo(() => {
    if (!ringGeometry?.gemstone) return null
    return buildBufferGeometry(ringGeometry.gemstone)
  }, [ringGeometry])

  if (!ringGeometry) return null

  return (
    <group>
      {editorMode === 'sculpt' ? (
        <SculptableMesh geometryData={ringGeometry.ring} />
      ) : (
        bandGeometry && (
          <mesh geometry={bandGeometry}>
            <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
          </mesh>
        )
      )}
      {gemstoneGeometry && (
        <mesh geometry={gemstoneGeometry}>
          <meshPhysicalMaterial
            transmission={1}
            ior={2.4}
            roughness={0}
            thickness={1}
            envMapIntensity={1}
            color="white"
          />
        </mesh>
      )}
    </group>
  )
}
