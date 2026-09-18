from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/ws/editor")
async def editor_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            await websocket.send_json({"status": "success", "received": payload})
    except WebSocketDisconnect:
        pass
