"""
Game API routes
"""

from flask import Blueprint, request, jsonify
from ..services.game_service import GameService
from ..services.database import DatabaseService
import os

game_bp = Blueprint('game', __name__, url_prefix='/api/game')

# Initialize services
db_service = DatabaseService(os.getenv('DATABASE_URL'))
game_service = GameService(db_service)


@game_bp.route('/start', methods=['POST'])
def start_game():
    """Start a new game session"""
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        lms_launch_id = data.get('lms_launch_id')

        if not student_id:
            return jsonify({'error': 'student_id is required'}), 400

        session = game_service.start_session(student_id, lms_launch_id)

        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get game session details"""
    try:
        session = game_service.get_session(session_id)

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        return jsonify({
            'success': True,
            'session': session.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/problem', methods=['POST'])
def get_next_problem():
    """Get next problem for a session"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        problem = game_service.generate_next_problem(session_id)

        return jsonify({
            'success': True,
            'problem': problem.to_dict(include_answer=False)
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/answer', methods=['POST'])
def submit_answer():
    """Submit answer to a problem"""
    try:
        data = request.get_json()
        problem_id = data.get('problem_id')
        session_id = data.get('session_id')
        student_id = data.get('student_id')
        answer = data.get('answer')
        time_spent = data.get('time_spent')

        if not all([problem_id, session_id, student_id, answer is not None]):
            return jsonify({
                'error': 'problem_id, session_id, student_id, and answer are required'
            }), 400

        result = game_service.submit_answer(
            problem_id,
            session_id,
            student_id,
            int(answer),
            time_spent
        )

        return jsonify({
            'success': True,
            **result
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/session/<session_id>/end', methods=['POST'])
def end_game(session_id):
    """End a game session"""
    try:
        session = game_service.end_session(session_id)

        return jsonify({
            'success': True,
            'session': session.to_dict()
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'DMN Math Game API'
    })
