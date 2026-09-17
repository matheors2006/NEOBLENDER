import { Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

function RingBand() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <torusGeometry args={[1, 0.35, 32, 64]} />
      <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
    </mesh>
  )
}

export function Scene() {
  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <RingBand />
      <Grid
        position={[0, -1.6, 0]}
        args={[20, 20]}
        cellColor="#3f3f46"
        sectionColor="#71717a"
        fadeDistance={25}
        infiniteGrid
      />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
