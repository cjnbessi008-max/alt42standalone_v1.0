"""
DMN Math Game - Flask Application
"""

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

# Configure session for LTI
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Import and register blueprints
from src.api.game_routes import game_bp
from src.api.student_routes import student_bp
from src.api.lti_routes import lti_bp

app.register_blueprint(game_bp)
app.register_blueprint(student_bp)
app.register_blueprint(lti_bp)


@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'DMN Math Game API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'game': '/api/game',
            'student': '/api/student',
            'lti': '/api/lti',
            'health': '/api/game/health'
        }
    })


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'DMN Math Game API'
    })


@app.errorhandler(404)
def not_found(error):
    """404 error handler"""
    return jsonify({
        'error': 'Endpoint not found',
        'status': 404
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """500 error handler"""
    return jsonify({
        'error': 'Internal server error',
        'status': 500
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    print(f"""
    ╔══════════════════════════════════════╗
    ║   DMN Math Game API Server          ║
    ║   Port: {port}                          ║
    ║   Debug: {debug}                        ║
    ╚══════════════════════════════════════╝
    """)

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
