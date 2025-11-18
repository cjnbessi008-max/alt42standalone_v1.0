"""
DMN Dropout Detection API Server
Flask-based REST API for collecting and analyzing student behavior

Compatible with: Python 3.8+, MySQL 5.7, Moodle 3.7
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from datetime import datetime
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import DatabaseManager
from utils.logger import setup_logger
from utils.config import Config
from engine.detector import DropoutDetector
from engine.analyzer import BehaviorAnalyzer
from engine.alert_manager import AlertManager
from moodle.client import MoodleClient

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Moodle integration

# Load configuration
config = Config()

# Setup logging
logger = setup_logger('dmn_api', config.get('log_level', 'INFO'))

# Initialize components
db = DatabaseManager(config)
detector = DropoutDetector(config, db)
analyzer = BehaviorAnalyzer(config, db)
alert_manager = AlertManager(config, db)
moodle_client = MoodleClient(config)


# ============================================================================
# Health Check
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


# ============================================================================
# Tracking Endpoints
# ============================================================================

@app.route('/api/track', methods=['POST'])
def track_single_event():
    """
    Track a single behavior event

    Request body:
    {
        "studentId": 123,
        "courseId": 456,
        "activityId": 789,
        "sessionId": "abc123",
        "eventType": "mouse_click",
        "eventData": {...},
        "timestamp": "2025-11-18T10:30:00Z"
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['studentId', 'courseId', 'eventType', 'timestamp']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get or create session
        session_id = data.get('sessionId')
        if not session_id:
            session_id = db.create_session(
                student_id=data['studentId'],
                course_id=data['courseId'],
                activity_id=data.get('activityId')
            )

        # Store event
        db.store_behavior_event(
            session_id=session_id,
            event_type=data['eventType'],
            event_data=data.get('eventData', {}),
            event_timestamp=data['timestamp']
        )

        # Check for dropout signals
        dropout_events = detector.check_for_dropout(
            session_id=session_id,
            event_type=data['eventType'],
            event_data=data.get('eventData', {})
        )

        # Generate alerts if needed
        if dropout_events:
            for dropout_event in dropout_events:
                alert_manager.handle_dropout_event(dropout_event)

        logger.info(f"Tracked event: {data['eventType']} for student {data['studentId']}")

        return jsonify({
            'success': True,
            'sessionId': session_id,
            'dropoutDetected': len(dropout_events) > 0
        })

    except Exception as e:
        logger.error(f"Error tracking event: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/track/batch', methods=['POST'])
def track_batch_events():
    """
    Track multiple behavior events in batch

    Request body:
    {
        "studentId": 123,
        "courseId": 456,
        "activityId": 789,
        "sessionId": "abc123",
        "events": [
            {
                "type": "mouse_click",
                "data": {...},
                "timestamp": "2025-11-18T10:30:00Z"
            },
            ...
        ],
        "stats": {
            "mouseMovements": 100,
            "mouseClicks": 20,
            "keyPresses": 50,
            "scrolls": 15
        }
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['studentId', 'courseId', 'events']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get or create session
        session_id = data.get('sessionId')
        if not session_id:
            session_id = db.create_session(
                student_id=data['studentId'],
                course_id=data['courseId'],
                activity_id=data.get('activityId')
            )

        # Store events
        all_dropout_events = []
        for event in data['events']:
            db.store_behavior_event(
                session_id=session_id,
                event_type=event['type'],
                event_data=event.get('data', {}),
                event_timestamp=event['timestamp']
            )

            # Check for dropout signals
            dropout_events = detector.check_for_dropout(
                session_id=session_id,
                event_type=event['type'],
                event_data=event.get('data', {})
            )
            all_dropout_events.extend(dropout_events)

        # Update session statistics
        if 'stats' in data:
            db.update_session_stats(session_id, data['stats'])

        # Calculate engagement score
        engagement_score = analyzer.calculate_engagement_score(session_id)
        db.update_session_engagement(session_id, engagement_score)

        # Generate alerts if needed
        if all_dropout_events:
            for dropout_event in all_dropout_events:
                alert_manager.handle_dropout_event(dropout_event)

        logger.info(f"Tracked {len(data['events'])} events for student {data['studentId']}")

        return jsonify({
            'success': True,
            'sessionId': session_id,
            'eventsProcessed': len(data['events']),
            'dropoutEventsDetected': len(all_dropout_events),
            'engagementScore': engagement_score
        })

    except Exception as e:
        logger.error(f"Error tracking batch: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.route('/api/students/<int:student_id>/engagement-score', methods=['GET'])
def get_student_engagement(student_id):
    """Get student engagement score"""
    try:
        course_id = request.args.get('courseId')

        engagement_data = analyzer.get_student_engagement(
            student_id=student_id,
            course_id=course_id
        )

        return jsonify(engagement_data)

    except Exception as e:
        logger.error(f"Error getting engagement: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/dropout-events', methods=['GET'])
def get_dropout_events():
    """Get dropout events with filters"""
    try:
        student_id = request.args.get('student_id')
        course_id = request.args.get('course_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        severity = request.args.get('severity')

        events = db.get_dropout_events(
            student_id=student_id,
            course_id=course_id,
            start_date=start_date,
            end_date=end_date,
            severity=severity
        )

        return jsonify({
            'events': events,
            'count': len(events)
        })

    except Exception as e:
        logger.error(f"Error getting dropout events: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session_details(session_id):
    """Get detailed session information"""
    try:
        session = db.get_session(session_id)
        events = db.get_session_events(session_id)
        dropouts = db.get_session_dropout_events(session_id)

        return jsonify({
            'session': session,
            'events': events,
            'dropouts': dropouts
        })

    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# Dashboard Endpoints
# ============================================================================

@app.route('/api/dashboard/teacher/<int:teacher_id>', methods=['GET'])
def get_teacher_dashboard(teacher_id):
    """Get teacher dashboard data"""
    try:
        course_id = request.args.get('courseId')

        # Get current active students with low engagement
        at_risk_students = analyzer.get_at_risk_students(
            teacher_id=teacher_id,
            course_id=course_id
        )

        # Get recent dropout events
        recent_dropouts = db.get_dropout_events(
            course_id=course_id,
            hours=24
        )

        # Get course statistics
        course_stats = analyzer.get_course_statistics(course_id)

        return jsonify({
            'atRiskStudents': at_risk_students,
            'recentDropouts': recent_dropouts,
            'courseStats': course_stats
        })

    except Exception as e:
        logger.error(f"Error getting dashboard: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# Moodle Integration Endpoints
# ============================================================================

@app.route('/api/moodle/sync/students', methods=['POST'])
def sync_students():
    """Sync students from Moodle"""
    try:
        course_id = request.args.get('courseId')

        students = moodle_client.get_enrolled_students(course_id)
        count = db.sync_students(students)

        logger.info(f"Synced {count} students from Moodle course {course_id}")

        return jsonify({
            'success': True,
            'studentsSynced': count
        })

    except Exception as e:
        logger.error(f"Error syncing students: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/moodle/sync/courses', methods=['POST'])
def sync_courses():
    """Sync courses from Moodle"""
    try:
        teacher_id = request.args.get('teacherId')

        courses = moodle_client.get_teacher_courses(teacher_id)
        count = db.sync_courses(courses)

        logger.info(f"Synced {count} courses from Moodle")

        return jsonify({
            'success': True,
            'coursesSynced': count
        })

    except Exception as e:
        logger.error(f"Error syncing courses: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# Alert Configuration Endpoints
# ============================================================================

@app.route('/api/alerts/config', methods=['GET', 'POST'])
def manage_alert_config():
    """Get or update alert configuration"""
    try:
        if request.method == 'GET':
            teacher_id = request.args.get('teacherId')
            course_id = request.args.get('courseId')

            config = db.get_alert_config(teacher_id, course_id)
            return jsonify(config)

        else:  # POST
            data = request.get_json()
            db.save_alert_config(data)

            return jsonify({
                'success': True,
                'message': 'Alert configuration saved'
            })

    except Exception as e:
        logger.error(f"Error managing alert config: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# WebSocket for Real-time Alerts (using Flask-SocketIO)
# ============================================================================

# Note: For production, consider using Flask-SocketIO or similar
# This is a placeholder for WebSocket functionality

@app.route('/api/alerts/subscribe', methods=['GET'])
def subscribe_alerts():
    """
    WebSocket subscription endpoint
    In production, implement with Flask-SocketIO or similar
    """
    return jsonify({
        'message': 'WebSocket not implemented in this version',
        'suggestion': 'Use polling or implement Flask-SocketIO'
    })


# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    # Development server
    port = config.get('api_port', 5000)
    debug = config.get('debug', False)

    logger.info(f"Starting DMN Detection API on port {port}")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
