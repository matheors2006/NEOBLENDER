export interface ExportRingRequest {
  radius: number
  thickness: number
}

export interface GeometryData {
  vertices: number[][]
  faces: number[][]
}

export interface BooleanOperationRequest {
  action: 'boolean_difference'
  target_mesh: GeometryData
  tool_mesh: GeometryData
}

export interface CompositeRingGeometry {
  ring: GeometryData
  gemstone: GeometryData | null
}
