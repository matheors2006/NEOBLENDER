import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.models.schemas import BooleanOperationSpec, RingGenerationSpec
from app.services.geometry_service import (
    generate_base_ring,
    perform_boolean_difference,
    perform_boolean_union,
)

router = APIRouter()

BOOLEAN_OPERATIONS = {
    "boolean_difference": perform_boolean_difference,
    "boolean_union": perform_boolean_union,
}


@router.websocket("/ws/editor")
async def editor_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            action = payload.get("action")

            if action == "create_ring":
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
            elif action in BOOLEAN_OPERATIONS:
                try:
                    boolean_spec = BooleanOperationSpec(**payload)
                except ValidationError as exc:
                    await websocket.send_json(
                        {"status": "error", "errors": json.loads(exc.json())}
                    )
                    continue

                try:
                    altered_ring = BOOLEAN_OPERATIONS[boolean_spec.action](
                        target_data=boolean_spec.target_mesh.model_dump(),
                        tool_data=boolean_spec.tool_mesh.model_dump(),
                    )
                except Exception as exc:
                    await websocket.send_json(
                        {"status": "error", "detail": f"Boolean operation failed: {exc}"}
                    )
                    continue

                await websocket.send_json({"ring": altered_ring, "gemstone": None})
            else:
                await websocket.send_json({"status": "success", "received": payload})
    except WebSocketDisconnect:
        pass
