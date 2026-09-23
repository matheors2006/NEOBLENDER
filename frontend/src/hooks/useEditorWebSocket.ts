import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type {
  BooleanOperationRequest,
  CompositeRingGeometry,
  GeometryData,
} from '../types/api-specs'

const WS_URL = 'ws://localhost:8000/ws/editor'

type PendingRequest = 'create_ring' | 'boolean'

export function useEditorWebSocket() {
  const socketRef = useRef<WebSocket | null>(null)
  // The backend answers requests in order, and both result types share the
  // same `{ ring, gemstone }` shape, so we track what each reply belongs to.
  const pendingRef = useRef<PendingRequest[]>([])
  const setRingGeometry = useEditorStore((state) => state.setRingGeometry)
  const updateRingMesh = useEditorStore((state) => state.updateRingMesh)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onopen = () => {
      if (socketRef.current !== socket) return
      pendingRef.current = []
      setIsConnected(true)
    }

    socket.onclose = () => {
      if (socketRef.current !== socket) return
      pendingRef.current = []
      setIsConnected(false)
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (!data || typeof data !== 'object') return

      const isResult = 'ring' in data
      const isError = data.status === 'error'
      if (!isResult && !isError) return

      const request = pendingRef.current.shift()

      if (isError) {
        console.error('Editor request failed:', data)
        return
      }

      const result = data as CompositeRingGeometry
      if (request === 'boolean') {
        updateRingMesh(result.ring)
      } else {
        setRingGeometry(result)
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [setRingGeometry, updateRingMesh])

  const requestRing = useCallback(
    (
      radius: number,
      thickness: number,
      hasGemstone: boolean,
      gemstoneSize: number,
    ) => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) return

      pendingRef.current.push('create_ring')
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

  const requestBoolean = useCallback(
    (
      action: BooleanOperationRequest['action'],
      targetMesh: GeometryData,
      toolMesh: GeometryData,
    ) => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) return

      const payload: BooleanOperationRequest = {
        action,
        target_mesh: targetMesh,
        tool_mesh: toolMesh,
      }

      pendingRef.current.push('boolean')
      socket.send(JSON.stringify(payload))
    },
    [],
  )

  const requestBooleanDifference = useCallback(
    (targetMesh: GeometryData, toolMesh: GeometryData) =>
      requestBoolean('boolean_difference', targetMesh, toolMesh),
    [requestBoolean],
  )

  const requestBooleanUnion = useCallback(
    (targetMesh: GeometryData, toolMesh: GeometryData) =>
      requestBoolean('boolean_union', targetMesh, toolMesh),
    [requestBoolean],
  )

  return {
    requestRing,
    requestBooleanDifference,
    requestBooleanUnion,
    isConnected,
  }
}
