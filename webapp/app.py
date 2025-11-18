"""
Web Application for Student Performance Analysis
Flask-based web interface for viewing and analyzing student performance data
"""

from flask import Flask, render_template, request, jsonify, send_file
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from analysis_pipeline import AnalysisPipeline
from deviation_analyzer import DeviationMetrics

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

# Configuration
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'output')
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'database.config.json')


@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')


@app.route('/api/courses')
def get_courses():
    """Get available course analysis results"""
    try:
        if not os.path.exists(OUTPUT_DIR):
            return jsonify({'courses': []})

        # Find all summary files
        summary_files = []
        for filename in os.listdir(OUTPUT_DIR):
            if filename.startswith('course_') and filename.endswith('_summary.json'):
                filepath = os.path.join(OUTPUT_DIR, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    summary_files.append({
                        'filename': filename,
                        'course_id': data.get('course_id'),
                        'analysis_date': data.get('analysis_date'),
                        'total_students': data.get('total_students'),
                        'analyzed_students': data.get('analyzed_students')
                    })

        return jsonify({'courses': summary_files})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze', methods=['POST'])
def run_analysis():
    """Run analysis for a course"""
    try:
        data = request.json
        course_id = data.get('course_id')

        if not course_id:
            return jsonify({'error': 'course_id is required'}), 400

        # Run analysis
        pipeline = AnalysisPipeline(config_path=CONFIG_PATH)
        result = pipeline.run_complete_analysis(course_id, output_dir=OUTPUT_DIR)

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/course/<int:course_id>/summary')
def get_course_summary(course_id):
    """Get course analysis summary"""
    try:
        # Find the most recent summary file
        summary_files = [f for f in os.listdir(OUTPUT_DIR)
                          if f.startswith(f'course_{course_id}_summary_') and f.endswith('.json')]

        if not summary_files:
            return jsonify({'error': 'No analysis found for this course'}), 404

        # Get most recent
        summary_files.sort(reverse=True)
        latest_file = os.path.join(OUTPUT_DIR, summary_files[0])

        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/course/<int:course_id>/students')
def get_course_students(course_id):
    """Get all student deviation data for a course"""
    try:
        # Find the most recent detailed reports file
        report_files = [f for f in os.listdir(OUTPUT_DIR)
                         if f.startswith(f'course_{course_id}_detailed_reports_') and f.endswith('.json')]

        if not report_files:
            return jsonify({'error': 'No analysis found for this course'}), 404

        # Get most recent
        report_files.sort(reverse=True)
        latest_file = os.path.join(OUTPUT_DIR, report_files[0])

        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Extract key information for listing
        students = []
        for report in data:
            dev_metrics = report['deviation_metrics']
            students.append({
                'user_id': dev_metrics['user_id'],
                'name': dev_metrics['student_name'],
                'overall_deviation': dev_metrics['overall_deviation_score'],
                'percentile_rank': dev_metrics['percentile_rank'],
                'grade': _get_grade(dev_metrics['overall_deviation_score']),
                'accuracy_deviation': dev_metrics['accuracy_deviation'],
                'consistency_deviation': dev_metrics['consistency_deviation']
            })

        # Sort by overall deviation (best first)
        students.sort(key=lambda x: x['overall_deviation'])

        return jsonify({'students': students})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/course/<int:course_id>/student/<int:user_id>')
def get_student_detail(course_id, user_id):
    """Get detailed analysis for a specific student"""
    try:
        # Find the most recent detailed reports file
        report_files = [f for f in os.listdir(OUTPUT_DIR)
                         if f.startswith(f'course_{course_id}_detailed_reports_') and f.endswith('.json')]

        if not report_files:
            return jsonify({'error': 'No analysis found'}), 404

        # Get most recent
        report_files.sort(reverse=True)
        latest_file = os.path.join(OUTPUT_DIR, report_files[0])

        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find the student's report
        student_report = None
        for report in data:
            if report['deviation_metrics']['user_id'] == user_id:
                student_report = report
                break

        if not student_report:
            return jsonify({'error': 'Student not found'}), 404

        return jsonify(student_report)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/course/<int:course_id>/download/csv')
def download_csv(course_id):
    """Download CSV export"""
    try:
        # Find the most recent CSV file
        csv_files = [f for f in os.listdir(OUTPUT_DIR)
                      if f.startswith(f'course_{course_id}_deviations_') and f.endswith('.csv')]

        if not csv_files:
            return jsonify({'error': 'No CSV file found'}), 404

        # Get most recent
        csv_files.sort(reverse=True)
        latest_file = os.path.join(OUTPUT_DIR, csv_files[0])

        return send_file(latest_file, as_attachment=True, download_name=f'course_{course_id}_analysis.csv')

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/dashboard')
def dashboard():
    """Dashboard page"""
    return render_template('dashboard.html')


@app.route('/course/<int:course_id>')
def course_detail(course_id):
    """Course detail page"""
    return render_template('course_detail.html', course_id=course_id)


@app.route('/student/<int:course_id>/<int:user_id>')
def student_detail(course_id, user_id):
    """Student detail page"""
    return render_template('student_detail.html', course_id=course_id, user_id=user_id)


def _get_grade(deviation_score):
    """Get letter grade from deviation score"""
    if deviation_score < 10:
        return 'S'
    elif deviation_score < 25:
        return 'A'
    elif deviation_score < 40:
        return 'B'
    elif deviation_score < 60:
        return 'C'
    else:
        return 'D'


if __name__ == '__main__':
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)
