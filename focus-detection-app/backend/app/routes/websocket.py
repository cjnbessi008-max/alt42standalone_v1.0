from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# 활성 웹소켓 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
        logger.info(f"WebSocket connected for session {session_id}")

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_session(self, message: str, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message: {e}")


manager = ConnectionManager()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)

    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                message_type = message.get("type")

                # 메시지 타입에 따른 처리
                if message_type == "focus-update":
                    # 실시간 집중도 업데이트를 같은 세션의 모든 클라이언트에 브로드캐스트
                    await manager.broadcast_to_session(data, session_id)

                elif message_type == "session-start":
                    logger.info(f"Session {session_id} started")
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "alert",
                            "level": "info",
                            "message": "세션이 시작되었습니다."
                        }),
                        websocket
                    )

                elif message_type == "session-end":
                    logger.info(f"Session {session_id} ended")
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "alert",
                            "level": "info",
                            "message": "세션이 종료되었습니다."
                        }),
                        websocket
                    )

                else:
                    logger.warning(f"Unknown message type: {message_type}")

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
                await manager.send_personal_message(
                    json.dumps({
                        "type": "alert",
                        "level": "error",
                        "message": "Invalid message format"
                    }),
                    websocket
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        logger.info(f"Client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)
