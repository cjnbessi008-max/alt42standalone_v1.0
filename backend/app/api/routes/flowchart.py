"""
API routes for flowchart generation and visualization
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime
import time

from app.db.database import get_db
from app.models.student_solution import (
    StudentSolution, StudentAction, FlowchartNode, FlowchartEdge, ActionType
)
from app.schemas.flowchart import (
    FlowchartGenerationRequest, FlowchartGenerationResponse,
    FlowchartData, FlowchartNodeResponse, FlowchartEdgeResponse,
    SolutionFlowchartResponse, NodePosition, NodeStyle, EdgeStyle
)

router = APIRouter()


class FlowchartGenerator:
    """Service class for generating flowcharts from student actions"""

    def __init__(self, db: Session):
        self.db = db

    def generate_flowchart(
        self,
        solution_id: UUID,
        layout_algorithm: str = "dagre",
        auto_position: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a flowchart from student actions
        """
        start_time = time.time()

        # Get solution and actions
        solution = self.db.query(StudentSolution).filter(
            StudentSolution.id == solution_id
        ).first()

        if not solution:
            raise HTTPException(status_code=404, detail="Solution not found")

        actions = self.db.query(StudentAction).filter(
            StudentAction.solution_id == solution_id
        ).order_by(StudentAction.sequence_number).all()

        if not actions:
            raise HTTPException(status_code=404, detail="No actions found for this solution")

        # Clear existing flowchart data
        self.db.query(FlowchartNode).filter(
            FlowchartNode.solution_id == solution_id
        ).delete()
        self.db.query(FlowchartEdge).filter(
            FlowchartEdge.solution_id == solution_id
        ).delete()

        # Create nodes
        nodes = []
        node_map = {}  # action_id -> node_id mapping

        # Start node
        start_node = FlowchartNode(
            solution_id=solution_id,
            node_type="start",
            label="Start Problem",
            description="Student begins solving the problem",
            position_x=100 if auto_position else 0,
            position_y=50 if auto_position else 0,
            style={
                "backgroundColor": "#4CAF50",
                "borderColor": "#45a049",
                "color": "#ffffff"
            }
        )
        self.db.add(start_node)
        self.db.flush()
        nodes.append(start_node)
        node_map["start"] = start_node.id

        # Create nodes for each action
        y_offset = 150
        for i, action in enumerate(actions):
            node_type = self._get_node_type(action.action_type)
            style = self._get_node_style(action.action_type)

            node = FlowchartNode(
                solution_id=solution_id,
                node_type=node_type,
                label=self._get_action_label(action),
                description=self._get_action_description(action),
                position_x=100 + (i % 3) * 200 if auto_position else 0,
                position_y=y_offset + (i // 3) * 100 if auto_position else 0,
                action_id=action.id,
                data={
                    "action_type": action.action_type.value,
                    "sequence_number": action.sequence_number,
                    "time_since_previous": action.time_since_previous,
                    "action_data": action.action_data
                },
                style=style
            )
            self.db.add(node)
            self.db.flush()
            nodes.append(node)
            node_map[str(action.id)] = node.id

        # End node
        end_node = FlowchartNode(
            solution_id=solution_id,
            node_type="end",
            label="Complete" if solution.is_correct else "Submit Answer",
            description=f"Solution {'correct' if solution.is_correct else 'submitted'}",
            position_x=100 if auto_position else 0,
            position_y=y_offset + ((len(actions) + 2) // 3) * 100 if auto_position else 0,
            style={
                "backgroundColor": "#2196F3" if solution.is_correct else "#FF9800",
                "borderColor": "#1976D2" if solution.is_correct else "#F57C00",
                "color": "#ffffff"
            }
        )
        self.db.add(end_node)
        self.db.flush()
        nodes.append(end_node)
        node_map["end"] = end_node.id

        # Create edges
        edges = []

        # Edge from start to first action
        if actions:
            first_edge = FlowchartEdge(
                solution_id=solution_id,
                source_node_id=start_node.id,
                target_node_id=node_map[str(actions[0].id)],
                label="Begin",
                style={"strokeColor": "#666666", "strokeWidth": 2}
            )
            self.db.add(first_edge)
            edges.append(first_edge)

        # Edges between actions
        for i, action in enumerate(actions[:-1]):
            next_action = actions[i + 1]
            edge = FlowchartEdge(
                solution_id=solution_id,
                source_node_id=node_map[str(action.id)],
                target_node_id=node_map[str(next_action.id)],
                label=self._get_edge_label(action, next_action),
                weight=1.0,
                style=self._get_edge_style(action, next_action)
            )
            self.db.add(edge)
            edges.append(edge)

        # Edge from last action to end
        if actions:
            last_edge = FlowchartEdge(
                solution_id=solution_id,
                source_node_id=node_map[str(actions[-1].id)],
                target_node_id=end_node.id,
                label="Submit",
                style={"strokeColor": "#666666", "strokeWidth": 2}
            )
            self.db.add(last_edge)
            edges.append(last_edge)

        self.db.commit()

        # Refresh all nodes and edges
        for node in nodes:
            self.db.refresh(node)
        for edge in edges:
            self.db.refresh(edge)

        generation_time = (time.time() - start_time) * 1000  # Convert to ms

        return {
            "nodes": nodes,
            "edges": edges,
            "generation_time_ms": generation_time
        }

    def _get_node_type(self, action_type: ActionType) -> str:
        """Determine node type based on action type"""
        decision_types = [ActionType.INCORRECT_ANSWER, ActionType.VIEW_HINT]
        if action_type in decision_types:
            return "decision"
        return "action"

    def _get_node_style(self, action_type: ActionType) -> Dict[str, Any]:
        """Get node style based on action type"""
        styles = {
            ActionType.VIEW_PROBLEM: {
                "backgroundColor": "#E3F2FD",
                "borderColor": "#2196F3",
                "color": "#1565C0"
            },
            ActionType.ATTEMPT_SOLUTION: {
                "backgroundColor": "#FFF3E0",
                "borderColor": "#FF9800",
                "color": "#E65100"
            },
            ActionType.VIEW_HINT: {
                "backgroundColor": "#F3E5F5",
                "borderColor": "#9C27B0",
                "color": "#6A1B9A"
            },
            ActionType.VIEW_EXPLANATION: {
                "backgroundColor": "#E8F5E9",
                "borderColor": "#4CAF50",
                "color": "#2E7D32"
            },
            ActionType.CORRECT_ANSWER: {
                "backgroundColor": "#C8E6C9",
                "borderColor": "#4CAF50",
                "color": "#1B5E20"
            },
            ActionType.INCORRECT_ANSWER: {
                "backgroundColor": "#FFCDD2",
                "borderColor": "#F44336",
                "color": "#C62828"
            },
            ActionType.USE_TOOL: {
                "backgroundColor": "#E1F5FE",
                "borderColor": "#03A9F4",
                "color": "#01579B"
            }
        }
        return styles.get(action_type, {
            "backgroundColor": "#F5F5F5",
            "borderColor": "#9E9E9E",
            "color": "#424242"
        })

    def _get_action_label(self, action: StudentAction) -> str:
        """Get human-readable label for action"""
        labels = {
            ActionType.VIEW_PROBLEM: "View Problem",
            ActionType.ATTEMPT_SOLUTION: "Attempt Solution",
            ActionType.VIEW_HINT: "View Hint",
            ActionType.VIEW_EXPLANATION: "View Explanation",
            ActionType.CORRECT_ANSWER: "✓ Correct Answer",
            ActionType.INCORRECT_ANSWER: "✗ Incorrect Answer",
            ActionType.SKIP_PROBLEM: "Skip Problem",
            ActionType.REVISE_ANSWER: "Revise Answer",
            ActionType.USE_TOOL: "Use Tool"
        }
        base_label = labels.get(action.action_type, action.action_type.value)
        return f"{base_label} ({action.sequence_number})"

    def _get_action_description(self, action: StudentAction) -> str:
        """Get detailed description for action"""
        desc = f"Action {action.sequence_number}: {action.action_type.value}"
        if action.time_since_previous:
            desc += f" (after {action.time_since_previous:.1f}s)"
        return desc

    def _get_edge_label(self, action: StudentAction, next_action: StudentAction) -> str:
        """Get label for edge between actions"""
        if action.time_since_previous:
            return f"{next_action.time_since_previous:.1f}s"
        return ""

    def _get_edge_style(self, action: StudentAction, next_action: StudentAction) -> Dict[str, Any]:
        """Get edge style based on actions"""
        # Highlight quick transitions (< 2 seconds)
        if next_action.time_since_previous and next_action.time_since_previous < 2.0:
            return {
                "strokeColor": "#FF5722",
                "strokeWidth": 3,
                "animated": True
            }
        return {
            "strokeColor": "#666666",
            "strokeWidth": 2,
            "animated": False
        }


@router.post("/generate", response_model=FlowchartGenerationResponse)
async def generate_flowchart(
    request: FlowchartGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a visual flowchart from student solution actions
    """
    generator = FlowchartGenerator(db)
    result = generator.generate_flowchart(
        solution_id=request.solution_id,
        layout_algorithm=request.layout_algorithm,
        auto_position=request.auto_position
    )

    return FlowchartGenerationResponse(
        solution_id=request.solution_id,
        flowchart=FlowchartData(
            nodes=[FlowchartNodeResponse.from_orm(node) for node in result["nodes"]],
            edges=[FlowchartEdgeResponse.from_orm(edge) for edge in result["edges"]]
        ),
        generation_time_ms=result["generation_time_ms"],
        total_nodes=len(result["nodes"]),
        total_edges=len(result["edges"])
    )


@router.get("/solution/{solution_id}", response_model=SolutionFlowchartResponse)
async def get_solution_flowchart(
    solution_id: UUID,
    regenerate: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get flowchart for a solution (generate if not exists or regenerate=True)
    """
    solution = db.query(StudentSolution).filter(
        StudentSolution.id == solution_id
    ).first()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Check if flowchart exists
    existing_nodes = db.query(FlowchartNode).filter(
        FlowchartNode.solution_id == solution_id
    ).count()

    if existing_nodes == 0 or regenerate:
        # Generate flowchart
        generator = FlowchartGenerator(db)
        generator.generate_flowchart(solution_id=solution_id)

    # Fetch flowchart data
    nodes = db.query(FlowchartNode).filter(
        FlowchartNode.solution_id == solution_id
    ).all()

    edges = db.query(FlowchartEdge).filter(
        FlowchartEdge.solution_id == solution_id
    ).all()

    actions = db.query(StudentAction).filter(
        StudentAction.solution_id == solution_id
    ).order_by(StudentAction.sequence_number).all()

    return SolutionFlowchartResponse(
        solution_id=solution.id,
        student_id=solution.student_id,
        problem_id=solution.problem_id,
        module_id=solution.module_id,
        started_at=solution.started_at,
        completed_at=solution.completed_at,
        time_spent_seconds=solution.time_spent_seconds,
        is_correct=solution.is_correct,
        attempts_count=solution.attempts_count,
        hints_used_count=solution.hints_used_count,
        flowchart=FlowchartData(
            nodes=[FlowchartNodeResponse.from_orm(node) for node in nodes],
            edges=[FlowchartEdgeResponse.from_orm(edge) for edge in edges]
        ),
        actions=[
            {
                "action_type": action.action_type.value,
                "action_data": action.action_data,
                "timestamp": action.timestamp,
                "sequence_number": action.sequence_number
            }
            for action in actions
        ]
    )


@router.delete("/solution/{solution_id}")
async def delete_flowchart(
    solution_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete flowchart data for a solution
    """
    nodes_deleted = db.query(FlowchartNode).filter(
        FlowchartNode.solution_id == solution_id
    ).delete()

    edges_deleted = db.query(FlowchartEdge).filter(
        FlowchartEdge.solution_id == solution_id
    ).delete()

    db.commit()

    return {
        "solution_id": solution_id,
        "nodes_deleted": nodes_deleted,
        "edges_deleted": edges_deleted,
        "message": "Flowchart deleted successfully"
    }
