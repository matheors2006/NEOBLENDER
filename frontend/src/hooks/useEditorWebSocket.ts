import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { CompositeRingGeometry } from '../types/api-specs'

const WS_URL = 'ws://localhost:8000/ws/editor'

export function useEditorWebSocket() {
  const socketRef = useRef<WebSocket | null>(null)
  const setRingGeometry = useEditorStore((state) => state.setRingGeometry)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onopen = () => {
      setIsConnected(true)
    }

    socket.onclose = () => {
      setIsConnected(false)
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data && typeof data === 'object' && 'ring' in data) {
        setRingGeometry(data as CompositeRingGeometry)
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [setRingGeometry])

  const requestRing = useCallback(
    (
      radius: number,
      thickness: number,
      hasGemstone: boolean,
      gemstoneSize: number,
    ) => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) return

      socket.send(
        JSON.stringify({
          action: 'create_ring',
          radius,
          thickness,
          has_gemstone: hasGemstone,
          gemstone_size: gemstoneSize,
        }),
      )
    },
    [],
  )

  return { requestRing, isConnected }
}
