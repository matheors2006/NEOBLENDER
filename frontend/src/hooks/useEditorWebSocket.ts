import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore, type RingGeometry } from '../store/useEditorStore'

const WS_URL = 'ws://localhost:8000/ws/editor'

interface EditorSocketMessage {
  status?: string
  mesh?: RingGeometry
}

export function useEditorWebSocket() {
  const socketRef = useRef<WebSocket | null>(null)
  const setRingGeometry = useEditorStore((state) => state.setRingGeometry)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onmessage = (event) => {
      const data: EditorSocketMessage = JSON.parse(event.data)

      if (data.status === 'success' && data.mesh) {
        setRingGeometry(data.mesh)
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [setRingGeometry])

  const requestRing = useCallback((radius: number, thickness: number) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return

    socket.send(
      JSON.stringify({
        action: 'create_ring',
        radius,
        thickness,
      }),
    )
  }, [])

  return { requestRing }
}
