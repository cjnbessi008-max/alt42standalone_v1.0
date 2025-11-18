from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    TokenData,
)
from app.schemas.problem import (
    ProblemBase,
    ProblemCreate,
    ProblemUpdate,
    ProblemResponse,
    ProblemReadingStage,
    ProblemSolvingStage,
)
from app.schemas.progress import (
    StudentProgressBase,
    StudentProgressCreate,
    StudentProgressUpdate,
    StudentProgressResponse,
    ConfirmReadingRequest,
    StartSolvingRequest,
    StudentAttemptCreate,
    StudentAttemptResponse,
    SubmitAnswerResponse,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenData",
    # Problem schemas
    "ProblemBase",
    "ProblemCreate",
    "ProblemUpdate",
    "ProblemResponse",
    "ProblemReadingStage",
    "ProblemSolvingStage",
    # Progress schemas
    "StudentProgressBase",
    "StudentProgressCreate",
    "StudentProgressUpdate",
    "StudentProgressResponse",
    "ConfirmReadingRequest",
    "StartSolvingRequest",
    "StudentAttemptCreate",
    "StudentAttemptResponse",
    "SubmitAnswerResponse",
]
