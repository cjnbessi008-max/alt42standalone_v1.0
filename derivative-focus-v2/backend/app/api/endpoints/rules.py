"""
Derivative Rules Endpoints
API routes for managing derivative rules
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.db.models import DerivativeRule
from app.schemas.problem import DerivativeRuleResponse

router = APIRouter()


@router.get("/", response_model=List[DerivativeRuleResponse])
async def get_all_rules(
    core_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all derivative rules
    """
    stmt = select(DerivativeRule).order_by(DerivativeRule.display_order)

    if core_only:
        stmt = stmt.where(DerivativeRule.is_core_rule == True)

    result = await db.execute(stmt)
    rules = result.scalars().all()

    return rules


@router.get("/core", response_model=List[DerivativeRuleResponse])
async def get_core_rules(db: AsyncSession = Depends(get_db)):
    """
    Get the 3 core derivative rules
    """
    stmt = select(DerivativeRule).where(
        DerivativeRule.is_core_rule == True
    ).order_by(DerivativeRule.display_order).limit(3)

    result = await db.execute(stmt)
    rules = result.scalars().all()

    return rules
