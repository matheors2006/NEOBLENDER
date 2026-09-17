import { Scene } from './components/canvas/Scene'
import { Toolbar } from './components/ui/Toolbar'

function App() {
  return (
    <div className="relative h-screen w-screen bg-neutral-950">
      <Scene />
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <Toolbar />
      </div>
    </div>
  )
}

export default App
