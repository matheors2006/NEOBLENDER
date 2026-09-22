import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.models.schemas import RingGenerationSpec
from app.services.geometry_service import generate_base_ring

router = APIRouter()


@router.websocket("/ws/editor")
async def editor_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()

            if payload.get("action") == "create_ring":
                try:
                    spec = RingGenerationSpec(**payload)
                except ValidationError as exc:
                    await websocket.send_json(
                        {"status": "error", "errors": json.loads(exc.json())}
                    )
                    continue

                mesh_data = generate_base_ring(
                    radius=spec.radius,
                    thickness=spec.thickness,
                    has_gemstone=spec.has_gemstone,
                    gemstone_size=spec.gemstone_size,
                )
                await websocket.send_json(mesh_data)
            else:
                await websocket.send_json({"status": "success", "received": payload})
    except WebSocketDisconnect:
        pass
