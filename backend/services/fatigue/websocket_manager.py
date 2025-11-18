"""
WebSocket Manager for Real-time Fatigue Notifications

Manages WebSocket connections and broadcasts fatigue updates, break recommendations,
and recovery progress to connected clients.
"""

from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio
from collections import defaultdict


class WebSocketManager:
    """
    Manages WebSocket connections for real-time fatigue monitoring updates.
    Supports broadcasting to specific sessions, students, or all connected clients.
    """

    def __init__(self):
        # Map of session_id -> list of WebSocket connections
        self.session_connections: Dict[str, List[WebSocket]] = defaultdict(list)

        # Map of student_id -> list of WebSocket connections
        self.student_connections: Dict[str, List[WebSocket]] = defaultdict(list)

        # All active connections
        self.active_connections: Set[WebSocket] = set()

        # Map of WebSocket -> metadata
        self.connection_metadata: Dict[WebSocket, Dict] = {}

    async def connect(
        self,
        websocket: WebSocket,
        session_id: str,
        student_id: str = None
    ):
        """
        Accept and register a new WebSocket connection.

        Args:
            websocket: WebSocket connection instance
            session_id: Session UUID to subscribe to
            student_id: Optional student UUID for student-specific notifications
        """
        await websocket.accept()

        # Add to active connections
        self.active_connections.add(websocket)

        # Add to session-specific connections
        self.session_connections[session_id].append(websocket)

        # Add to student-specific connections if provided
        if student_id:
            self.student_connections[student_id].append(websocket)

        # Store metadata
        self.connection_metadata[websocket] = {
            'session_id': session_id,
            'student_id': student_id,
            'connected_at': asyncio.get_event_loop().time()
        }

        # Send connection confirmation
        await websocket.send_json({
            'event': 'connected',
            'data': {
                'session_id': session_id,
                'message': 'Successfully connected to fatigue monitoring'
            }
        })

    def disconnect(self, websocket: WebSocket, session_id: str):
        """
        Remove a WebSocket connection.

        Args:
            websocket: WebSocket connection to remove
            session_id: Session UUID
        """
        # Remove from active connections
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        # Remove from session connections
        if session_id in self.session_connections:
            if websocket in self.session_connections[session_id]:
                self.session_connections[session_id].remove(websocket)

            # Clean up empty lists
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]

        # Remove from student connections
        metadata = self.connection_metadata.get(websocket, {})
        student_id = metadata.get('student_id')

        if student_id and student_id in self.student_connections:
            if websocket in self.student_connections[student_id]:
                self.student_connections[student_id].remove(websocket)

            if not self.student_connections[student_id]:
                del self.student_connections[student_id]

        # Remove metadata
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.

        Args:
            message: Message dictionary to send
            websocket: Target WebSocket connection
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message to websocket: {e}")
            # Connection might be closed, handle cleanup
            metadata = self.connection_metadata.get(websocket, {})
            session_id = metadata.get('session_id')
            if session_id:
                self.disconnect(websocket, session_id)

    async def broadcast_to_session(self, session_id: str, message: dict):
        """
        Broadcast a message to all connections subscribed to a session.

        Args:
            session_id: Target session UUID
            message: Message dictionary to broadcast
        """
        if session_id not in self.session_connections:
            return

        # Get all connections for this session
        connections = self.session_connections[session_id].copy()

        # Send to all connections
        for connection in connections:
            await self.send_personal_message(message, connection)

    async def broadcast_to_student(self, student_id: str, message: dict):
        """
        Broadcast a message to all connections for a specific student.

        Args:
            student_id: Target student UUID
            message: Message dictionary to broadcast
        """
        if student_id not in self.student_connections:
            return

        connections = self.student_connections[student_id].copy()

        for connection in connections:
            await self.send_personal_message(message, connection)

    async def broadcast_to_all(self, message: dict):
        """
        Broadcast a message to all active connections.

        Args:
            message: Message dictionary to broadcast
        """
        connections = list(self.active_connections)

        for connection in connections:
            await self.send_personal_message(message, connection)

    async def send_fatigue_update(
        self,
        session_id: str,
        fatigue_score: float,
        fatigue_level: int,
        trend: str
    ):
        """
        Send a fatigue score update to session subscribers.

        Args:
            session_id: Session UUID
            fatigue_score: Current fatigue score (0-100)
            fatigue_level: Fatigue level (1-5)
            trend: Trend string ('increasing', 'stable', 'decreasing')
        """
        message = {
            'event': 'fatigue_updated',
            'data': {
                'session_id': session_id,
                'fatigue_score': fatigue_score,
                'fatigue_level': fatigue_level,
                'trend': trend,
                'timestamp': asyncio.get_event_loop().time()
            }
        }

        await self.broadcast_to_session(session_id, message)

    async def send_break_recommendation(
        self,
        student_id: str,
        recommendation_id: str,
        break_type: str,
        duration_minutes: int,
        reason: str,
        urgency: str
    ):
        """
        Send a break recommendation notification.

        Args:
            student_id: Student UUID
            recommendation_id: Recommendation UUID
            break_type: Type of break ('micro', 'short', 'medium', 'long')
            duration_minutes: Recommended duration
            reason: Explanation for recommendation
            urgency: Urgency level ('low', 'medium', 'high')
        """
        message = {
            'event': 'break_recommended',
            'data': {
                'recommendation_id': recommendation_id,
                'break_type': break_type,
                'duration_minutes': duration_minutes,
                'reason': reason,
                'urgency': urgency,
                'timestamp': asyncio.get_event_loop().time()
            }
        }

        await self.broadcast_to_student(student_id, message)

    async def send_break_reminder(
        self,
        student_id: str,
        original_recommendation_id: str,
        minutes_since_dismissed: int,
        current_fatigue_score: float
    ):
        """
        Send a reminder for a previously dismissed break.

        Args:
            student_id: Student UUID
            original_recommendation_id: Original recommendation UUID
            minutes_since_dismissed: Time since dismissal
            current_fatigue_score: Current fatigue score
        """
        message = {
            'event': 'break_reminder',
            'data': {
                'original_recommendation_id': original_recommendation_id,
                'minutes_since_dismissed': minutes_since_dismissed,
                'current_fatigue_score': current_fatigue_score,
                'message': f"It's been {minutes_since_dismissed} minutes. Time for that break!",
                'timestamp': asyncio.get_event_loop().time()
            }
        }

        await self.broadcast_to_student(student_id, message)

    async def send_recovery_progress(
        self,
        session_id: str,
        recommendation_id: str,
        recovery_percentage: float,
        estimated_time_remaining: int
    ):
        """
        Send recovery progress during a break.

        Args:
            session_id: Session UUID
            recommendation_id: Break recommendation UUID
            recovery_percentage: Recovery progress (0-100)
            estimated_time_remaining: Estimated minutes until full recovery
        """
        message = {
            'event': 'recovery_progress',
            'data': {
                'recommendation_id': recommendation_id,
                'recovery_percentage': recovery_percentage,
                'estimated_time_remaining': estimated_time_remaining,
                'timestamp': asyncio.get_event_loop().time()
            }
        }

        await self.broadcast_to_session(session_id, message)

    async def send_achievement_notification(
        self,
        student_id: str,
        achievement_type: str,
        message: str
    ):
        """
        Send positive reinforcement notification.

        Args:
            student_id: Student UUID
            achievement_type: Type of achievement
            message: Achievement message
        """
        notification = {
            'event': 'achievement',
            'data': {
                'type': achievement_type,
                'message': message,
                'timestamp': asyncio.get_event_loop().time()
            }
        }

        await self.broadcast_to_student(student_id, notification)

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return len(self.active_connections)

    def get_session_connection_count(self, session_id: str) -> int:
        """Get number of connections for a specific session"""
        return len(self.session_connections.get(session_id, []))

    def get_student_connection_count(self, student_id: str) -> int:
        """Get number of connections for a specific student"""
        return len(self.student_connections.get(student_id, []))


# Singleton instance
ws_manager = WebSocketManager()
