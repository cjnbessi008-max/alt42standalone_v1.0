from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class StepType(str, Enum):
    """전략 단계 타입"""
    ANALYSIS = "analysis"
    STRATEGY = "strategy"
    SUBSTEP = "substep"
    SOLUTION = "solution"


class StrategyStep(BaseModel):
    """문제 해결 전략의 각 단계"""
    id: str = Field(..., description="단계 고유 ID")
    type: StepType = Field(..., description="단계 타입")
    title: str = Field(..., description="단계 제목")
    content: str = Field(..., description="단계 설명")
    order: int = Field(..., description="순서")
    parent_id: Optional[str] = Field(None, description="부모 단계 ID (서브 단계인 경우)")
    children_ids: List[str] = Field(default_factory=list, description="자식 단계 ID 리스트")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "step-1",
                "type": "analysis",
                "title": "문제 분석",
                "content": "주어진 문제는 분수의 덧셈입니다.",
                "order": 1,
                "parent_id": None,
                "children_ids": ["step-1-1", "step-1-2"]
            }
        }


class ProblemRequest(BaseModel):
    """문제 입력 요청"""
    problem: str = Field(..., description="해결할 문제", min_length=1)
    subject: str = Field(default="math", description="과목 (math, physics, etc.)")
    difficulty: Optional[str] = Field(None, description="난이도 (easy, medium, hard)")

    class Config:
        json_schema_extra = {
            "example": {
                "problem": "1/2 + 1/3을 계산하세요.",
                "subject": "math",
                "difficulty": "medium"
            }
        }


class StrategyResponse(BaseModel):
    """전략 생성 응답"""
    problem: str = Field(..., description="입력된 문제")
    steps: List[StrategyStep] = Field(..., description="해결 전략 단계들")
    total_steps: int = Field(..., description="전체 단계 수")

    class Config:
        json_schema_extra = {
            "example": {
                "problem": "1/2 + 1/3을 계산하세요.",
                "steps": [
                    {
                        "id": "step-1",
                        "type": "analysis",
                        "title": "문제 분석",
                        "content": "두 분수의 덧셈 문제입니다.",
                        "order": 1,
                        "parent_id": None,
                        "children_ids": []
                    }
                ],
                "total_steps": 5
            }
        }
