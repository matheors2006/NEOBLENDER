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
    ring_mesh = trimesh.creation.torus(
        major_radius=radius,
        minor_radius=thickness,
        major_sections=128,
        minor_sections=64,
    )

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


def _load_boolean_operands(
    target_data: dict, tool_data: dict
) -> tuple[trimesh.Trimesh, trimesh.Trimesh]:
    target_mesh = trimesh.Trimesh(
        vertices=target_data["vertices"], faces=target_data["faces"]
    )
    tool_mesh = trimesh.Trimesh(
        vertices=tool_data["vertices"], faces=tool_data["faces"]
    )
    return target_mesh, tool_mesh


def perform_boolean_difference(target_data: dict, tool_data: dict) -> dict:
    target_mesh, tool_mesh = _load_boolean_operands(target_data, tool_data)
    result_mesh = target_mesh.difference(tool_mesh, engine="manifold")
    return _mesh_to_dict(result_mesh)


def perform_boolean_union(target_data: dict, tool_data: dict) -> dict:
    target_mesh, tool_mesh = _load_boolean_operands(target_data, tool_data)
    result_mesh = target_mesh.union(tool_mesh, engine="manifold")
    return _mesh_to_dict(result_mesh)
