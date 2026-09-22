import trimesh
from fastapi import APIRouter, Response

from app.models.schemas import ExportRingSpec
from app.services.geometry_service import generate_base_ring

router = APIRouter()


@router.post("/api/export/stl")
def export_ring_stl(spec: ExportRingSpec):
    mesh_data = generate_base_ring(radius=spec.radius, thickness=spec.thickness)
    ring_data = mesh_data["ring"]
    mesh = trimesh.Trimesh(vertices=ring_data["vertices"], faces=ring_data["faces"])
    stl_bytes = mesh.export(file_type="stl")

    return Response(
        content=stl_bytes,
        media_type="application/sla",
        headers={"Content-Disposition": 'attachment; filename="ring.stl"'},
    )
