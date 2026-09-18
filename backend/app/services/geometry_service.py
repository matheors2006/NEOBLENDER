import trimesh


def generate_base_ring(radius: float, thickness: float) -> dict:
    mesh = trimesh.creation.torus(major_radius=radius, minor_radius=thickness)
    return {
        "vertices": mesh.vertices.tolist(),
        "faces": mesh.faces.tolist(),
    }
