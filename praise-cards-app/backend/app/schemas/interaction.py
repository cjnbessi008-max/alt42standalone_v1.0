from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InteractionCreate(BaseModel):
    praise_card_id: str
    student_id: str
    interaction_type: str  # "like", "comment", "view"
    comment_text: Optional[str] = None


class InteractionResponse(BaseModel):
    id: str
    praise_card_id: str
    student_id: str
    interaction_type: str
    comment_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
