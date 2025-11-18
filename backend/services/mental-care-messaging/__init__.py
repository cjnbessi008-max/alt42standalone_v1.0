"""
Mental Care Messaging Service
Generates supportive messages for students
"""

from .message_generator import (
    MentalCareMessageGenerator,
    MentalCareMessage,
    MessageType,
)

__all__ = [
    "MentalCareMessageGenerator",
    "MentalCareMessage",
    "MessageType",
]
