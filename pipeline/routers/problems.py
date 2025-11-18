"""
Problem management endpoints for inverse reflection module
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from uuid import UUID
import json

from database import get_db
from services.claude_service import ClaudeService
from services.cache_service import CacheService
from schemas.problem_schemas import (
    InverseProblemCreate,
    InverseProblemResponse,
    InverseProblemUpdate,
    GenerateProblemRequest
)

router = APIRouter()


@router.post("/generate", response_model=InverseProblemResponse)
async def generate_problem(
    request: GenerateProblemRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new inverse function problem using Claude AI

    This endpoint uses Claude to:
    1. Analyze the function type and difficulty
    2. Generate appropriate original function
    3. Calculate inverse function
    4. Create pedagogical hints
    5. Determine domain/range restrictions
    """
    claude_service = ClaudeService()

    try:
        # Use Claude to generate inverse function details
        problem_data = await claude_service.generate_inverse_function(
            original_function=request.original_function,
            function_type=request.function_type
        )

        # Create database record
        from sqlalchemy import text

        # Build insert query
        insert_query = text("""
            INSERT INTO ai_education.inverse_problems (
                module_id, function_type, original_function, inverse_function,
                domain_min, domain_max, range_min, range_max,
                difficulty_level, tags, hints, visualization_config
            ) VALUES (
                :module_id, :function_type, :original_function, :inverse_function,
                :domain_min, :domain_max, :range_min, :range_max,
                :difficulty_level, :tags, :hints, :visualization_config
            )
            RETURNING id, created_at, updated_at
        """)

        result = await db.execute(
            insert_query,
            {
                "module_id": request.module_id,
                "function_type": request.function_type,
                "original_function": request.original_function,
                "inverse_function": problem_data["inverse_function"],
                "domain_min": problem_data.get("domain_min"),
                "domain_max": problem_data.get("domain_max"),
                "range_min": problem_data.get("range_min"),
                "range_max": problem_data.get("range_max"),
                "difficulty_level": request.difficulty_level,
                "tags": request.tags or [],
                "hints": json.dumps(problem_data.get("hints", [])),
                "visualization_config": json.dumps(request.visualization_config or {})
            }
        )

        await db.commit()
        row = result.fetchone()

        return {
            "id": row[0],
            "module_id": request.module_id,
            "function_type": request.function_type,
            "original_function": request.original_function,
            "inverse_function": problem_data["inverse_function"],
            "domain_min": problem_data.get("domain_min"),
            "domain_max": problem_data.get("domain_max"),
            "difficulty_level": request.difficulty_level,
            "hints": problem_data.get("hints", []),
            "solution_steps": problem_data.get("solution_steps", []),
            "key_concepts": problem_data.get("key_concepts", []),
            "created_at": row[1],
            "updated_at": row[2]
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Problem generation failed: {str(e)}")


@router.get("/{problem_id}", response_model=dict)
async def get_problem(
    problem_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific problem by ID"""
    from sqlalchemy import text

    query = text("""
        SELECT * FROM ai_education.inverse_problems
        WHERE id = :problem_id
    """)

    result = await db.execute(query, {"problem_id": str(problem_id)})
    problem = result.fetchone()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return dict(problem._mapping)


@router.get("/", response_model=List[dict])
async def list_problems(
    module_id: Optional[UUID] = None,
    difficulty: Optional[str] = Query(None, regex="^(easy|medium|hard)$"),
    function_type: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    List problems with optional filters

    Filters:
    - module_id: Filter by module
    - difficulty: Filter by difficulty level
    - function_type: Filter by function type
    - limit/offset: Pagination
    """
    from sqlalchemy import text

    # Build dynamic query
    conditions = []
    params = {"limit": limit, "offset": offset}

    if module_id:
        conditions.append("module_id = :module_id")
        params["module_id"] = str(module_id)

    if difficulty:
        conditions.append("difficulty_level = :difficulty")
        params["difficulty"] = difficulty

    if function_type:
        conditions.append("function_type = :function_type")
        params["function_type"] = function_type

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    query = text(f"""
        SELECT * FROM ai_education.inverse_problems
        {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)

    result = await db.execute(query, params)
    problems = result.fetchall()

    return [dict(row._mapping) for row in problems]


@router.post("/batch-generate")
async def batch_generate_problems(
    function_types: List[str],
    difficulty_level: str,
    count: int = Query(5, le=20),
    module_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate multiple problems using Claude AI

    This is useful for quickly populating a module with varied problems
    """
    claude_service = ClaudeService()

    try:
        # Generate problems using Claude
        generated_problems = await claude_service.generate_problem_set(
            function_types=function_types,
            difficulty_level=difficulty_level,
            count=count
        )

        # Insert into database
        inserted_ids = []
        for problem in generated_problems:
            # Generate inverse for each problem
            inverse_data = await claude_service.generate_inverse_function(
                original_function=problem.get("original_function"),
                function_type=problem.get("function_type")
            )

            from sqlalchemy import text
            insert_query = text("""
                INSERT INTO ai_education.inverse_problems (
                    module_id, function_type, original_function, inverse_function,
                    domain_min, domain_max, difficulty_level, tags, hints
                ) VALUES (
                    :module_id, :function_type, :original_function, :inverse_function,
                    :domain_min, :domain_max, :difficulty_level, :tags, :hints
                )
                RETURNING id
            """)

            result = await db.execute(
                insert_query,
                {
                    "module_id": str(module_id) if module_id else None,
                    "function_type": problem.get("function_type"),
                    "original_function": problem.get("original_function"),
                    "inverse_function": inverse_data["inverse_function"],
                    "domain_min": inverse_data.get("domain_min"),
                    "domain_max": inverse_data.get("domain_max"),
                    "difficulty_level": difficulty_level,
                    "tags": problem.get("tags", []),
                    "hints": json.dumps(inverse_data.get("hints", []))
                }
            )

            inserted_ids.append(result.fetchone()[0])

        await db.commit()

        return {
            "success": True,
            "count": len(inserted_ids),
            "problem_ids": inserted_ids
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Batch generation failed: {str(e)}")
