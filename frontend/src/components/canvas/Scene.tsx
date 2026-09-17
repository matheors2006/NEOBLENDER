import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

function PlaceholderModel() {
  return (
    <mesh rotation={[0.4, 0.4, 0]}>
      <torusGeometry args={[1, 0.35, 32, 64]} />
      <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
    </mesh>
  )
}

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} />
      <PlaceholderModel />
      <OrbitControls />
    </Canvas>
  )
}
