"""
Pydantic schemas for flowchart data
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class NodePosition(BaseModel):
    """Position of a node in the flowchart"""
    x: float
    y: float


class NodeStyle(BaseModel):
    """Visual style for a node"""
    backgroundColor: Optional[str] = "#ffffff"
    borderColor: Optional[str] = "#000000"
    borderWidth: Optional[int] = 2
    color: Optional[str] = "#000000"


class FlowchartNodeCreate(BaseModel):
    """Schema for creating a flowchart node"""
    node_type: str = Field(..., description="Type of node: start, action, decision, end")
    label: str
    description: Optional[str] = None
    position: NodePosition
    action_id: Optional[UUID] = None
    data: Optional[Dict[str, Any]] = None
    style: Optional[NodeStyle] = None


class FlowchartNodeResponse(FlowchartNodeCreate):
    """Schema for flowchart node response"""
    id: UUID
    solution_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class EdgeStyle(BaseModel):
    """Visual style for an edge"""
    strokeColor: Optional[str] = "#000000"
    strokeWidth: Optional[int] = 2
    animated: Optional[bool] = False


class FlowchartEdgeCreate(BaseModel):
    """Schema for creating a flowchart edge"""
    source_node_id: UUID
    target_node_id: UUID
    label: Optional[str] = None
    weight: Optional[float] = 1.0
    data: Optional[Dict[str, Any]] = None
    style: Optional[EdgeStyle] = None


class FlowchartEdgeResponse(FlowchartEdgeCreate):
    """Schema for flowchart edge response"""
    id: UUID
    solution_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class FlowchartData(BaseModel):
    """Complete flowchart data"""
    nodes: List[FlowchartNodeResponse]
    edges: List[FlowchartEdgeResponse]


class ActionData(BaseModel):
    """Data for a student action"""
    action_type: str
    action_data: Optional[Dict[str, Any]] = None
    timestamp: datetime
    sequence_number: int


class SolutionFlowchartResponse(BaseModel):
    """Response containing solution and flowchart data"""
    solution_id: UUID
    student_id: UUID
    problem_id: UUID
    module_id: UUID
    started_at: datetime
    completed_at: Optional[datetime] = None
    time_spent_seconds: int
    is_correct: Optional[bool] = None
    attempts_count: int
    hints_used_count: int
    flowchart: FlowchartData
    actions: List[ActionData]

    class Config:
        from_attributes = True


class FlowchartGenerationRequest(BaseModel):
    """Request to generate a flowchart from student actions"""
    solution_id: UUID
    layout_algorithm: Optional[str] = "dagre"  # dagre, hierarchical, force
    auto_position: Optional[bool] = True


class FlowchartGenerationResponse(BaseModel):
    """Response after generating a flowchart"""
    solution_id: UUID
    flowchart: FlowchartData
    generation_time_ms: float
    total_nodes: int
    total_edges: int
