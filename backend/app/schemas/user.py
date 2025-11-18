from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    grade_level: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    grade_level: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None
