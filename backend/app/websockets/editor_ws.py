from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.geometry_service import generate_base_ring

router = APIRouter()


@router.websocket("/ws/editor")
async def editor_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()

            if payload.get("action") == "create_ring":
                mesh_data = generate_base_ring(
                    radius=payload["radius"],
                    thickness=payload["thickness"],
                )
                await websocket.send_json({"status": "success", "mesh": mesh_data})
            else:
                await websocket.send_json({"status": "success", "received": payload})
    except WebSocketDisconnect:
        pass
