"""
Student API routes
"""

from flask import Blueprint, request, jsonify
from ..services.game_service import GameService
from ..services.database import DatabaseService
import os

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

# Initialize services
db_service = DatabaseService(os.getenv('DATABASE_URL'))
game_service = GameService(db_service)


@student_bp.route('/<student_id>/progress', methods=['GET'])
def get_progress(student_id):
    """Get student's overall progress"""
    try:
        progress = game_service.get_student_progress(student_id)

        if not progress:
            return jsonify({
                'success': True,
                'progress': None,
                'message': 'No progress data available'
            })

        return jsonify({
            'success': True,
            'progress': progress.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/<student_id>/sessions', methods=['GET'])
def get_session_history(student_id):
    """Get student's session history"""
    try:
        limit = request.args.get('limit', 10, type=int)
        sessions = game_service.get_session_history(student_id, limit)

        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions],
            'count': len(sessions)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/create', methods=['POST'])
def create_student():
    """Create a new student"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        grade_level = data.get('grade_level')
        lms_user_id = data.get('lms_user_id')

        if not name:
            return jsonify({'error': 'name is required'}), 400

        query = """
            INSERT INTO students (name, email, grade_level, lms_user_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id, lms_user_id, name, email, grade_level, created_at, updated_at
        """
        result = db_service.execute_one(query, (name, email, grade_level, lms_user_id))

        from ..models.student import Student
        student = Student.from_db_row(result)

        return jsonify({
            'success': True,
            'student': student.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get student by ID"""
    try:
        query = """
            SELECT id, lms_user_id, name, email, grade_level, created_at, updated_at
            FROM students
            WHERE id = %s
        """
        result = db_service.execute_one(query, (student_id,))

        if not result:
            return jsonify({'error': 'Student not found'}), 404

        from ..models.student import Student
        student = Student.from_db_row(result)

        return jsonify({
            'success': True,
            'student': student.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/lms/<lms_user_id>', methods=['GET'])
def get_student_by_lms_id(lms_user_id):
    """Get student by LMS user ID"""
    try:
        query = """
            SELECT id, lms_user_id, name, email, grade_level, created_at, updated_at
            FROM students
            WHERE lms_user_id = %s
        """
        result = db_service.execute_one(query, (lms_user_id,))

        if not result:
            return jsonify({
                'success': False,
                'student': None,
                'message': 'Student not found'
            }), 404

        from ..models.student import Student
        student = Student.from_db_row(result)

        return jsonify({
            'success': True,
            'student': student.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
