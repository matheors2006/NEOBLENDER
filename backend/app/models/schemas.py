from typing import Literal

from pydantic import BaseModel, Field


class ExportRingSpec(BaseModel):
    radius: float = Field(gt=0)
    thickness: float = Field(gt=0)


class RingGenerationSpec(BaseModel):
    action: Literal["create_ring"]
    radius: float
    thickness: float
    has_gemstone: bool = False
    gemstone_size: float = 2.0


class MeshData(BaseModel):
    vertices: list[list[float]]
    faces: list[list[int]]


class GeometryResponseSpec(BaseModel):
    ring: MeshData
    gemstone: MeshData | None = None
