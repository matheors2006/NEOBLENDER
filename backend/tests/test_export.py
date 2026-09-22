from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_export_stl_returns_stl_file():
    response = client.post(
        "/api/export/stl",
        json={"radius": 10, "thickness": 2},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/sla"
