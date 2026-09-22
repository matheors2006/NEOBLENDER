import trimesh
from fastapi.testclient import TestClient

from app.services.geometry_service import generate_base_ring
from main import app

client = TestClient(app)


def test_editor_ws_returns_composite_geometry_for_gemstone_ring():
    payload = {
        "action": "create_ring",
        "radius": 10,
        "thickness": 2,
        "has_gemstone": True,
        "gemstone_size": 3,
    }

    with client.websocket_connect("/ws/editor") as websocket:
        websocket.send_json(payload)
        data = websocket.receive_json()

    assert "ring" in data
    assert "gemstone" in data


def test_editor_ws_boolean_difference_returns_altered_ring():
    target_ring = generate_base_ring(radius=10, thickness=2)["ring"]
    drill_bit = trimesh.creation.cylinder(radius=1, height=10)

    payload = {
        "action": "boolean_difference",
        "target_mesh": target_ring,
        "tool_mesh": {
            "vertices": drill_bit.vertices.tolist(),
            "faces": drill_bit.faces.tolist(),
        },
    }

    with client.websocket_connect("/ws/editor") as websocket:
        websocket.send_json(payload)
        data = websocket.receive_json()

    assert "ring" in data
    assert data["ring"]["vertices"]
    assert data["ring"]["faces"]
