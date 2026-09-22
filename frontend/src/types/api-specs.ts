export interface ExportRingRequest {
  radius: number
  thickness: number
}

export interface GeometryData {
  vertices: number[][]
  faces: number[][]
}

export interface CompositeRingGeometry {
  ring: GeometryData
  gemstone: GeometryData | null
}
