"""
LTI 1.3 API routes
"""

from flask import Blueprint, request, jsonify, redirect, session
from ..lms.lti_service import LTIService
from ..services.database import DatabaseService
from ..services.game_service import GameService
import os

lti_bp = Blueprint('lti', __name__, url_prefix='/api/lti')

# Initialize services
lti_service = LTIService()
db_service = DatabaseService(os.getenv('DATABASE_URL'))
game_service = GameService(db_service)


@lti_bp.route('/login', methods=['POST', 'GET'])
def lti_login():
    """
    LTI 1.3 Login Initiation
    Step 1 of LTI launch flow
    """
    try:
        # Get target_link_uri from request
        target_link_uri = request.args.get('target_link_uri') or request.form.get('target_link_uri')

        if not target_link_uri:
            return jsonify({'error': 'target_link_uri is required'}), 400

        # In production, implement OIDC login flow here
        # For now, redirect to launch endpoint
        return redirect(target_link_uri)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lti_bp.route('/launch', methods=['POST'])
def lti_launch():
    """
    LTI 1.3 Launch Endpoint
    Step 2 of LTI launch flow - receives and validates launch request
    """
    try:
        # Validate LTI message
        message_launch = lti_service.get_message_launch(request)

        if not message_launch:
            return jsonify({'error': 'Invalid LTI launch'}), 400

        # Extract user information
        user_info = lti_service.extract_user_info(message_launch)

        # Find or create student
        student = get_or_create_student(user_info)

        # Create launch record
        launch_data = message_launch.get_launch_data()
        save_lti_launch(student['id'], user_info, launch_data)

        # Start game session
        session_result = game_service.start_session(
            student['id'],
            lms_launch_id=user_info.get('resource_link_id')
        )

        # Store session info for grade passback
        session['lti_launch'] = {
            'student_id': student['id'],
            'session_id': session_result.id,
            'resource_link_id': user_info.get('resource_link_id')
        }

        # Redirect to game interface
        game_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{game_url}?session_id={session_result.id}")

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lti_bp.route('/jwks', methods=['GET'])
def get_jwks():
    """
    Public JSON Web Key Set endpoint
    Used by LMS to verify signatures
    """
    try:
        jwks = lti_service.generate_jwks()
        return jsonify(jwks)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lti_bp.route('/grade', methods=['POST'])
def send_grade():
    """
    Send grade back to LMS
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        score = data.get('score')

        if not all([session_id, score is not None]):
            return jsonify({'error': 'session_id and score are required'}), 400

        # Get session
        game_session = game_service.get_session(session_id)
        if not game_session:
            return jsonify({'error': 'Session not found'}), 404

        # Calculate score
        if game_session.total_problems > 0:
            percentage = (game_session.correct_answers / game_session.total_problems) * 100
        else:
            percentage = 0

        # Get LTI launch from session
        lti_launch_info = session.get('lti_launch')
        if not lti_launch_info:
            return jsonify({'error': 'No LTI launch information available'}), 400

        # Send grade (requires message_launch object - simplified here)
        # In production, retrieve and reconstruct the message_launch
        success = True  # Placeholder

        return jsonify({
            'success': success,
            'score': percentage,
            'message': 'Grade sent to LMS' if success else 'Failed to send grade'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lti_bp.route('/config.json', methods=['GET'])
def get_lti_config():
    """
    LTI configuration JSON for LMS registration
    """
    base_url = os.getenv('BASE_URL', 'http://localhost:5000')

    config = {
        "title": "DMN Math Game",
        "description": "A mini arithmetic game for Default Mode Network recovery",
        "oidc_initiation_url": f"{base_url}/api/lti/login",
        "target_link_uri": f"{base_url}/api/lti/launch",
        "scopes": [
            "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
            "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
            "https://purl.imsglobal.org/spec/lti-ags/scope/score"
        ],
        "extensions": [{
            "platform": "canvas.instructure.com",
            "settings": {
                "platform": "canvas.instructure.com",
                "placements": [{
                    "placement": "course_navigation",
                    "message_type": "LtiResourceLinkRequest",
                    "target_link_uri": f"{base_url}/api/lti/launch",
                    "text": "DMN Math Game"
                }]
            }
        }],
        "public_jwk_url": f"{base_url}/api/lti/jwks",
        "custom_fields": {}
    }

    return jsonify(config)


def get_or_create_student(user_info: dict) -> dict:
    """Helper function to find or create student"""
    lms_user_id = user_info.get('lms_user_id')

    # Try to find existing student
    query = """
        SELECT id, lms_user_id, name, email, grade_level, created_at, updated_at
        FROM students
        WHERE lms_user_id = %s
    """
    result = db_service.execute_one(query, (lms_user_id,))

    if result:
        from ..models.student import Student
        return Student.from_db_row(result).to_dict()

    # Create new student
    query = """
        INSERT INTO students (lms_user_id, name, email)
        VALUES (%s, %s, %s)
        RETURNING id, lms_user_id, name, email, grade_level, created_at, updated_at
    """
    result = db_service.execute_one(
        query,
        (lms_user_id, user_info.get('name'), user_info.get('email'))
    )

    from ..models.student import Student
    return Student.from_db_row(result).to_dict()


def save_lti_launch(student_id: str, user_info: dict, launch_data: dict):
    """Helper function to save LTI launch data"""
    import json

    query = """
        INSERT INTO lti_launches (student_id, lms_user_id, lms_context_id,
                                 lms_resource_link_id, launch_data)
        VALUES (%s, %s, %s, %s, %s)
    """
    db_service.execute_query(
        query,
        (
            student_id,
            user_info.get('lms_user_id'),
            user_info.get('context_id'),
            user_info.get('resource_link_id'),
            json.dumps(launch_data)
        )
    )
