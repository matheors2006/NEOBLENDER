import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CustomRingMesh } from './CustomRingMesh'

export function Scene() {
  return (
    <Canvas camera={{ position: [20, 20, 20], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 25, 15]} intensity={1.2} />
      <Environment preset="studio" />
      <CustomRingMesh />
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.5}
        scale={50}
        blur={2}
        far={10}
      />
      <Grid
        position={[0, -3, 0]}
        args={[60, 60]}
        cellColor="#3f3f46"
        sectionColor="#71717a"
        fadeDistance={100}
        infiniteGrid
      />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
