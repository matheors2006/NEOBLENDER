from fastapi.testclient import TestClient

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
