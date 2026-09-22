import trimesh


def _mesh_to_dict(mesh: trimesh.Trimesh) -> dict:
    return {
        "vertices": mesh.vertices.tolist(),
        "faces": mesh.faces.tolist(),
    }


def generate_base_ring(
    radius: float,
    thickness: float,
    has_gemstone: bool = False,
    gemstone_size: float = 2.0,
) -> dict:
    ring_mesh = trimesh.creation.torus(major_radius=radius, minor_radius=thickness)

    gemstone_data = None
    if has_gemstone:
        gemstone_mesh = trimesh.creation.icosphere(radius=gemstone_size)
        translation = trimesh.transformations.translation_matrix(
            [0, radius + thickness, 0]
        )
        gemstone_mesh.apply_transform(translation)
        gemstone_data = _mesh_to_dict(gemstone_mesh)

    return {
        "ring": _mesh_to_dict(ring_mesh),
        "gemstone": gemstone_data,
    }
