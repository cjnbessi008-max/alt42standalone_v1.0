from typing import List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from ..models.checklist import Checklist, ChecklistItem, ChecklistType
from ..models.generation_job import PipelineStage
from ..models.module import Module


class ChecklistGenerator:
    """Service for automatically generating checklists"""

    # Pipeline stage checklist templates
    PIPELINE_STAGES = [
        {
            "stage": PipelineStage.WORLD_MODEL.value,
            "title": "World Model Reconstruction",
            "description": "Understand and construct the educational domain model",
            "items": [
                {
                    "title": "Parse natural language request",
                    "description": "Extract key concepts and requirements from teacher's request",
                    "order": 1,
                },
                {
                    "title": "Identify domain entities",
                    "description": "Extract core concepts, operations, and relationships",
                    "order": 2,
                },
                {
                    "title": "Generate concept graph",
                    "description": "Create visual representation of domain model",
                    "order": 3,
                },
                {
                    "title": "Validate domain model",
                    "description": "Ensure completeness and consistency of world model",
                    "order": 4,
                },
            ],
        },
        {
            "stage": PipelineStage.RULES.value,
            "title": "Rule Generation",
            "description": "Extract and generate business rules from requirements",
            "items": [
                {
                    "title": "Extract business rules",
                    "description": "Identify validation, calculation, and progression rules",
                    "order": 5,
                },
                {
                    "title": "Assess rule complexity",
                    "description": "Analyze complexity metrics for each rule",
                    "order": 6,
                },
                {
                    "title": "Generate rule code",
                    "description": "Convert rules to executable code",
                    "order": 7,
                },
                {
                    "title": "Generate unit tests",
                    "description": "Create automated tests for all rules",
                    "order": 8,
                },
            ],
        },
        {
            "stage": PipelineStage.DATA.value,
            "title": "Data Management",
            "description": "Design database schema and generate test data",
            "items": [
                {
                    "title": "Analyze data requirements",
                    "description": "Identify all data entities and attributes needed",
                    "order": 9,
                },
                {
                    "title": "Design database schema",
                    "description": "Create optimized PostgreSQL schema",
                    "order": 10,
                },
                {
                    "title": "Generate migration scripts",
                    "description": "Create database migration files",
                    "order": 11,
                },
                {
                    "title": "Generate pseudo data",
                    "description": "Create realistic test data for the module",
                    "order": 12,
                },
            ],
        },
        {
            "stage": PipelineStage.INPUT_STRATEGY.value,
            "title": "Input Strategy Design",
            "description": "Determine optimal data collection methods",
            "items": [
                {
                    "title": "Identify required inputs",
                    "description": "List all data points needed from students",
                    "order": 13,
                },
                {
                    "title": "Select input methods",
                    "description": "Choose forms, tracking, or interactive prompts",
                    "order": 14,
                },
                {
                    "title": "Design validation rules",
                    "description": "Create client and server-side validation",
                    "order": 15,
                },
                {
                    "title": "Map data flow",
                    "description": "Define how data flows through the system",
                    "order": 16,
                },
            ],
        },
        {
            "stage": PipelineStage.UI.value,
            "title": "UI Auto-Generation",
            "description": "Generate user interface components",
            "items": [
                {
                    "title": "Analyze UX journey",
                    "description": "Map complete user interaction flow",
                    "order": 17,
                },
                {
                    "title": "Check for reusable components",
                    "description": "Identify existing UI components to reuse",
                    "order": 18,
                },
                {
                    "title": "Generate React components",
                    "description": "Create new UI components as needed",
                    "order": 19,
                },
                {
                    "title": "Apply styling and theming",
                    "description": "Ensure consistent design system",
                    "order": 20,
                },
                {
                    "title": "Implement accessibility",
                    "description": "Add ARIA labels and keyboard navigation",
                    "order": 21,
                },
            ],
        },
        {
            "stage": PipelineStage.DEPLOYMENT.value,
            "title": "Integration & Deployment",
            "description": "Deploy complete educational system",
            "items": [
                {
                    "title": "Generate API endpoints",
                    "description": "Create RESTful API for the module",
                    "order": 22,
                },
                {
                    "title": "Run integration tests",
                    "description": "Test complete workflows end-to-end",
                    "order": 23,
                },
                {
                    "title": "Create Docker containers",
                    "description": "Package application for deployment",
                    "order": 24,
                },
                {
                    "title": "Generate documentation",
                    "description": "Create user and technical documentation",
                    "order": 25,
                },
                {
                    "title": "Deploy to environment",
                    "description": "Launch the module for student access",
                    "order": 26,
                },
            ],
        },
    ]

    @staticmethod
    def generate_pipeline_checklist(
        db: Session, module_id: UUID, teacher_id: UUID
    ) -> Checklist:
        """Generate a complete pipeline checklist for a module"""
        checklist = Checklist(
            title=f"Module Generation Pipeline",
            description="Track progress of AI-powered module generation",
            checklist_type=ChecklistType.GENERATION_PIPELINE,
            module_id=module_id,
            teacher_id=teacher_id,
            auto_generated=True,
        )
        db.add(checklist)
        db.flush()

        # Add all pipeline stage items
        all_items = []
        for stage_config in ChecklistGenerator.PIPELINE_STAGES:
            for item_config in stage_config["items"]:
                item = ChecklistItem(
                    checklist_id=checklist.id,
                    title=item_config["title"],
                    description=item_config["description"],
                    order=item_config["order"],
                    pipeline_stage=stage_config["stage"],
                    is_required=True,
                )
                all_items.append(item)

        db.add_all(all_items)
        checklist.total_items = len(all_items)
        db.commit()
        db.refresh(checklist)

        return checklist

    @staticmethod
    def generate_learning_checklist(
        db: Session,
        module: Module,
        student_id: UUID,
        learning_objectives: List[Dict[str, Any]] = None,
    ) -> Checklist:
        """Generate a learning progress checklist for a student"""
        checklist = Checklist(
            title=f"Learning Progress: {module.name}",
            description=f"Track your progress through {module.name}",
            checklist_type=ChecklistType.LEARNING_PROGRESS,
            module_id=module.id,
            student_id=student_id,
            auto_generated=True,
        )
        db.add(checklist)
        db.flush()

        # Generate items based on module's learning objectives
        if learning_objectives is None:
            # Default learning objectives if none provided
            learning_objectives = ChecklistGenerator._generate_default_objectives(
                module
            )

        items = []
        for idx, objective in enumerate(learning_objectives, start=1):
            item = ChecklistItem(
                checklist_id=checklist.id,
                title=objective.get("title", f"Learning objective {idx}"),
                description=objective.get("description", ""),
                order=idx,
                is_required=objective.get("is_required", True),
            )
            items.append(item)

        db.add_all(items)
        checklist.total_items = len(items)
        db.commit()
        db.refresh(checklist)

        return checklist

    @staticmethod
    def _generate_default_objectives(module: Module) -> List[Dict[str, Any]]:
        """Generate default learning objectives based on module metadata"""
        objectives = [
            {
                "title": "Understand core concepts",
                "description": f"Learn the fundamental concepts of {module.name}",
                "is_required": True,
            },
            {
                "title": "Practice with examples",
                "description": "Work through guided examples and exercises",
                "is_required": True,
            },
            {
                "title": "Apply knowledge",
                "description": "Solve problems independently",
                "is_required": True,
            },
            {
                "title": "Complete assessment",
                "description": "Demonstrate mastery through assessment",
                "is_required": True,
            },
        ]

        # Add subject-specific objectives
        if module.subject == "mathematics":
            objectives.insert(
                1,
                {
                    "title": "Visualize mathematical concepts",
                    "description": "Use visual tools to understand relationships",
                    "is_required": False,
                },
            )

        return objectives

    @staticmethod
    def update_item_progress(
        db: Session, item_id: UUID, is_completed: bool, progress_percentage: int = None
    ) -> ChecklistItem:
        """Update progress of a checklist item"""
        item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
        if not item:
            raise ValueError(f"Checklist item {item_id} not found")

        item.is_completed = is_completed
        if progress_percentage is not None:
            item.progress_percentage = progress_percentage
        elif is_completed:
            item.progress_percentage = 100

        # Update parent checklist
        checklist = item.checklist
        completed_count = (
            db.query(ChecklistItem)
            .filter(
                ChecklistItem.checklist_id == checklist.id,
                ChecklistItem.is_completed == True,
            )
            .count()
        )
        checklist.completed_items = completed_count

        db.commit()
        db.refresh(item)

        return item

    @staticmethod
    def get_checklist_with_items(db: Session, checklist_id: UUID) -> Checklist:
        """Get checklist with all its items"""
        checklist = (
            db.query(Checklist)
            .filter(Checklist.id == checklist_id)
            .first()
        )
        if not checklist:
            raise ValueError(f"Checklist {checklist_id} not found")

        return checklist
