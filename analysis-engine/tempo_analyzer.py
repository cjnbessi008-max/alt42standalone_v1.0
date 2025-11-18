"""
Thinking Tempo Analyzer - Main Analysis Engine

Analyzes microsecond-level event data to compute thinking tempo patterns
and cognitive load indicators.

@package    local_thinking_tempo/analysis
@copyright  2025 KAIST Touch Math Academy
@license    MIT
"""

import pymysql
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TempoAnalyzer:
    """Main tempo analysis engine"""

    # Tempo thresholds in microseconds
    FAST_TEMPO_THRESHOLD = 500_000  # 500ms
    NORMAL_TEMPO_MAX = 3_000_000  # 3s
    DEEP_THINKING_MAX = 10_000_000  # 10s
    STUCK_THRESHOLD = 10_000_000  # 10s

    # Time bucket size for visualization (100ms)
    TIME_BUCKET_SIZE = 100_000  # microseconds

    def __init__(self, db_config: Dict[str, str]):
        """
        Initialize analyzer with database configuration

        Args:
            db_config: Database connection parameters
        """
        self.db_config = db_config
        self.connection = None

    def connect(self):
        """Establish database connection"""
        try:
            self.connection = pymysql.connect(
                host=self.db_config.get('host', 'localhost'),
                user=self.db_config.get('user', 'root'),
                password=self.db_config.get('password', ''),
                database=self.db_config.get('database', 'moodle'),
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")

    def analyze_session(self, session_id: int) -> Dict:
        """
        Analyze a complete thinking tempo session

        Args:
            session_id: Session ID to analyze

        Returns:
            Analysis results dictionary
        """
        logger.info(f"Starting analysis for session {session_id}")

        # Load session data
        session_data = self._load_session_data(session_id)
        if not session_data:
            logger.error(f"Session {session_id} not found")
            return {}

        # Load events
        events = self._load_session_events(session_id)
        if len(events) == 0:
            logger.warning(f"No events found for session {session_id}")
            return {}

        # Convert to DataFrame for analysis
        df = pd.DataFrame(events)

        # Perform analyses
        tempo_segments = self._analyze_tempo_segments(df, session_data)
        cognitive_load = self._analyze_cognitive_load(df)
        typing_analysis = self._analyze_typing_patterns(df)
        pause_analysis = self._analyze_pauses(df)
        behavioral_metrics = self._analyze_behavioral_patterns(df)

        # Detect patterns
        detected_patterns = self._detect_patterns(df, tempo_segments, behavioral_metrics)

        # Generate tempo map data
        tempo_map = self._generate_tempo_map(df, session_data)

        # Compute overall metrics
        overall_metrics = {
            'session_id': session_id,
            'total_duration_ms': session_data['total_duration'] / 1000,
            'total_events': len(events),
            'tempo_distribution': self._compute_tempo_distribution(tempo_segments),
            'avg_cognitive_load': cognitive_load['average'],
            'avg_typing_speed': typing_analysis['avg_speed'],
            'total_pauses': pause_analysis['total_pauses'],
            'avg_pause_duration_ms': pause_analysis['avg_duration_ms'],
            'revision_count': behavioral_metrics['revision_count'],
            'backspace_count': behavioral_metrics['backspace_count'],
            'paste_count': behavioral_metrics['paste_count'],
            'thinking_style': self._classify_thinking_style(tempo_segments, behavioral_metrics)
        }

        # Save results to database
        self._save_tempo_analysis(session_id, tempo_segments)
        self._save_detected_patterns(session_id, detected_patterns)
        self._save_tempo_map(session_id, tempo_map)

        logger.info(f"Analysis completed for session {session_id}")

        return {
            'overall_metrics': overall_metrics,
            'tempo_segments': tempo_segments,
            'detected_patterns': detected_patterns,
            'tempo_map': tempo_map
        }

    def _load_session_data(self, session_id: int) -> Optional[Dict]:
        """Load session metadata"""
        with self.connection.cursor() as cursor:
            sql = "SELECT * FROM mdl_thinking_tempo_sessions WHERE id = %s"
            cursor.execute(sql, (session_id,))
            return cursor.fetchone()

    def _load_session_events(self, session_id: int) -> List[Dict]:
        """Load all events for a session"""
        with self.connection.cursor() as cursor:
            sql = """
                SELECT * FROM mdl_thinking_tempo_events
                WHERE session_id = %s
                ORDER BY event_timestamp ASC
            """
            cursor.execute(sql, (session_id,))
            return cursor.fetchall()

    def _analyze_tempo_segments(self, df: pd.DataFrame, session_data: Dict) -> List[Dict]:
        """
        Analyze tempo segments based on inter-event intervals

        Returns list of tempo segments with category, duration, and metrics
        """
        segments = []

        # Calculate inter-event intervals
        df['interval'] = df['elapsed_time'].diff()

        # Identify tempo changes using threshold-based segmentation
        current_tempo = None
        segment_start = 0
        segment_events = []

        for idx, row in df.iterrows():
            interval = row['interval']
            if pd.isna(interval):
                interval = 0

            # Determine tempo category
            tempo = self._categorize_tempo(interval)

            if tempo != current_tempo:
                # Save previous segment
                if current_tempo is not None and len(segment_events) > 0:
                    segments.append(self._create_tempo_segment(
                        current_tempo,
                        segment_start,
                        row['elapsed_time'],
                        segment_events
                    ))

                # Start new segment
                current_tempo = tempo
                segment_start = row['elapsed_time']
                segment_events = [row]
            else:
                segment_events.append(row)

        # Add final segment
        if current_tempo is not None and len(segment_events) > 0:
            segments.append(self._create_tempo_segment(
                current_tempo,
                segment_start,
                df.iloc[-1]['elapsed_time'],
                segment_events
            ))

        return segments

    def _categorize_tempo(self, interval_us: float) -> str:
        """Categorize tempo based on interval"""
        if interval_us < self.FAST_TEMPO_THRESHOLD:
            return 'fast'
        elif interval_us < self.NORMAL_TEMPO_MAX:
            return 'normal'
        elif interval_us < self.DEEP_THINKING_MAX:
            return 'deep'
        else:
            return 'stuck'

    def _create_tempo_segment(self, tempo: str, start: int, end: int, events: List) -> Dict:
        """Create a tempo segment record"""
        duration = end - start
        event_count = len(events)

        # Calculate thinking intensity (0-100 scale)
        # Higher for fast tempo, lower for stuck
        intensity_map = {'fast': 90, 'normal': 60, 'deep': 40, 'stuck': 20}
        thinking_intensity = intensity_map.get(tempo, 50)

        # Calculate cognitive load based on event diversity
        event_types = set(e['event_type'] for e in events)
        cognitive_load = min(100, len(event_types) * 20 + event_count * 2)

        return {
            'tempo_category': tempo,
            'start_time': start,
            'end_time': end,
            'duration': duration,
            'event_count': event_count,
            'thinking_intensity': thinking_intensity,
            'cognitive_load': cognitive_load,
            'confidence_score': 0.85  # Can be refined with ML
        }

    def _analyze_cognitive_load(self, df: pd.DataFrame) -> Dict:
        """Analyze cognitive load indicators"""
        # Cognitive load indicators:
        # - Event frequency (high = high load)
        # - Event type diversity (high = high load)
        # - Rapid switching between elements (high = high load)

        total_duration_s = (df['elapsed_time'].max() - df['elapsed_time'].min()) / 1_000_000
        event_frequency = len(df) / total_duration_s if total_duration_s > 0 else 0

        event_type_diversity = df['event_type'].nunique()
        element_switches = (df['element_id'] != df['element_id'].shift()).sum()

        # Normalize to 0-100 scale
        load = min(100, event_frequency * 5 + event_type_diversity * 3 + element_switches * 0.5)

        return {
            'average': load,
            'event_frequency': event_frequency,
            'type_diversity': event_type_diversity,
            'element_switches': element_switches
        }

    def _analyze_typing_patterns(self, df: pd.DataFrame) -> Dict:
        """Analyze typing speed and patterns"""
        # Filter keyboard events
        typing_events = df[df['event_type'].isin(['keydown', 'keyup', 'input'])]

        if len(typing_events) == 0:
            return {'avg_speed': 0, 'total_chars': 0}

        # Estimate characters typed
        input_events = df[df['event_type'] == 'input']
        total_chars = 0

        if len(input_events) > 0:
            # Use last input value length
            last_input = input_events.iloc[-1]
            if 'input_value' in last_input and last_input['input_value']:
                total_chars = len(str(last_input['input_value']))

        # Calculate typing speed (characters per second)
        duration_s = (typing_events['elapsed_time'].max() - typing_events['elapsed_time'].min()) / 1_000_000
        avg_speed = total_chars / duration_s if duration_s > 0 else 0

        return {
            'avg_speed': avg_speed,
            'total_chars': total_chars,
            'total_typing_events': len(typing_events)
        }

    def _analyze_pauses(self, df: pd.DataFrame) -> Dict:
        """Analyze pause patterns"""
        # Define pause as gap > 1 second
        PAUSE_THRESHOLD = 1_000_000  # 1 second

        df['interval'] = df['elapsed_time'].diff()
        pauses = df[df['interval'] > PAUSE_THRESHOLD]

        total_pauses = len(pauses)
        avg_duration_us = pauses['interval'].mean() if total_pauses > 0 else 0
        max_pause_us = pauses['interval'].max() if total_pauses > 0 else 0

        return {
            'total_pauses': total_pauses,
            'avg_duration_ms': avg_duration_us / 1000,
            'max_pause_ms': max_pause_us / 1000
        }

    def _analyze_behavioral_patterns(self, df: pd.DataFrame) -> Dict:
        """Analyze behavioral indicators"""
        # Count revisions (backspace, delete)
        backspace_count = len(df[df['key_code'].isin(['8', '46'])])

        # Count paste events
        paste_count = len(df[df['event_type'] == 'paste'])

        # Count input changes (revisions)
        input_events = df[df['event_type'] == 'input']
        revision_count = 0

        if len(input_events) > 1:
            # Count times where input length decreased
            for i in range(1, len(input_events)):
                prev_val = input_events.iloc[i-1].get('input_value', '')
                curr_val = input_events.iloc[i].get('input_value', '')
                if len(str(curr_val)) < len(str(prev_val)):
                    revision_count += 1

        # Count focus changes
        focus_changes = len(df[df['event_type'].isin(['focus', 'blur'])])

        return {
            'backspace_count': backspace_count,
            'paste_count': paste_count,
            'revision_count': revision_count + backspace_count,
            'focus_changes': focus_changes
        }

    def _compute_tempo_distribution(self, segments: List[Dict]) -> Dict:
        """Compute percentage distribution of tempo categories"""
        total_duration = sum(s['duration'] for s in segments)

        if total_duration == 0:
            return {'fast': 0, 'normal': 0, 'deep': 0, 'stuck': 0}

        distribution = {}
        for tempo in ['fast', 'normal', 'deep', 'stuck']:
            tempo_duration = sum(s['duration'] for s in segments if s['tempo_category'] == tempo)
            distribution[tempo] = (tempo_duration / total_duration) * 100

        return distribution

    def _classify_thinking_style(self, segments: List[Dict], behavioral: Dict) -> str:
        """Classify overall thinking style"""
        dist = self._compute_tempo_distribution(segments)

        # Classification rules
        if dist['fast'] > 60:
            return 'impulsive'
        elif dist['deep'] > 50:
            return 'reflective'
        elif behavioral['revision_count'] > 10:
            return 'iterative'
        elif dist['normal'] > 60:
            return 'methodical'
        elif dist['stuck'] > 30:
            return 'struggling'
        else:
            return 'balanced'

    def _detect_patterns(self, df: pd.DataFrame, segments: List[Dict], behavioral: Dict) -> List[Dict]:
        """Detect predefined thinking patterns"""
        detected = []

        # Quick Recall pattern
        if len(df) < 10 and df['elapsed_time'].max() < 2_000_000:
            detected.append({
                'pattern_name': 'Quick Recall',
                'confidence': 0.9,
                'start_time': 0,
                'end_time': df['elapsed_time'].max()
            })

        # Trial and Error pattern
        if behavioral['revision_count'] > 5:
            detected.append({
                'pattern_name': 'Trial and Error',
                'confidence': min(0.95, 0.6 + behavioral['revision_count'] * 0.05),
                'start_time': 0,
                'end_time': df['elapsed_time'].max()
            })

        # Copy-Paste behavior
        if behavioral['paste_count'] > 0:
            paste_events = df[df['event_type'] == 'paste']
            for _, event in paste_events.iterrows():
                detected.append({
                    'pattern_name': 'Copy-Paste Behavior',
                    'confidence': 1.0,
                    'start_time': event['elapsed_time'],
                    'end_time': event['elapsed_time'] + 100_000
                })

        # Cognitive Struggle
        dist = self._compute_tempo_distribution(segments)
        if dist['stuck'] > 40:
            detected.append({
                'pattern_name': 'Cognitive Struggle',
                'confidence': min(0.95, dist['stuck'] / 50),
                'start_time': 0,
                'end_time': df['elapsed_time'].max()
            })

        return detected

    def _generate_tempo_map(self, df: pd.DataFrame, session_data: Dict) -> List[Dict]:
        """Generate time-bucketed data for tempo map visualization"""
        map_data = []

        total_duration = session_data['total_duration']
        num_buckets = int(total_duration / self.TIME_BUCKET_SIZE) + 1

        for i in range(num_buckets):
            bucket_start = i * self.TIME_BUCKET_SIZE
            bucket_end = bucket_start + self.TIME_BUCKET_SIZE

            # Get events in this bucket
            bucket_events = df[(df['elapsed_time'] >= bucket_start) &
                             (df['elapsed_time'] < bucket_end)]

            if len(bucket_events) == 0:
                tempo_score = 0
                activity_level = 0
                dominant_event = None
            else:
                # Calculate tempo score (0-100, higher = faster)
                avg_interval = bucket_events['elapsed_time'].diff().mean()
                if pd.isna(avg_interval) or avg_interval == 0:
                    tempo_score = 100
                else:
                    # Inverse relationship: shorter intervals = higher score
                    tempo_score = max(0, min(100, 100 - (avg_interval / 100_000)))

                activity_level = len(bucket_events)
                dominant_event = bucket_events['event_type'].mode()[0] if len(bucket_events) > 0 else None

            map_data.append({
                'time_bucket': i,
                'bucket_start': bucket_start,
                'bucket_end': bucket_end,
                'tempo_score': tempo_score,
                'activity_level': activity_level,
                'dominant_event_type': dominant_event,
                'event_count': len(bucket_events)
            })

        return map_data

    def _save_tempo_analysis(self, session_id: int, segments: List[Dict]):
        """Save tempo analysis results to database"""
        with self.connection.cursor() as cursor:
            # Delete existing analysis
            cursor.execute("DELETE FROM mdl_thinking_tempo_analysis WHERE session_id = %s", (session_id,))

            # Insert segments
            for segment in segments:
                sql = """
                    INSERT INTO mdl_thinking_tempo_analysis
                    (session_id, tempo_category, start_time, end_time, duration, event_count,
                     thinking_intensity, cognitive_load, confidence_score)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    session_id,
                    segment['tempo_category'],
                    segment['start_time'],
                    segment['end_time'],
                    segment['duration'],
                    segment['event_count'],
                    segment['thinking_intensity'],
                    segment['cognitive_load'],
                    segment['confidence_score']
                ))

            self.connection.commit()
            logger.info(f"Saved {len(segments)} tempo segments for session {session_id}")

    def _save_detected_patterns(self, session_id: int, patterns: List[Dict]):
        """Save detected patterns to database"""
        if len(patterns) == 0:
            return

        with self.connection.cursor() as cursor:
            # Get pattern IDs
            pattern_map = {}
            for pattern in patterns:
                cursor.execute("SELECT id FROM mdl_thinking_tempo_patterns WHERE pattern_name = %s",
                             (pattern['pattern_name'],))
                result = cursor.fetchone()
                if result:
                    pattern_map[pattern['pattern_name']] = result['id']

            # Insert detected patterns
            for pattern in patterns:
                if pattern['pattern_name'] in pattern_map:
                    sql = """
                        INSERT INTO mdl_thinking_tempo_detected_patterns
                        (session_id, pattern_id, start_time, end_time, confidence_score)
                        VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(sql, (
                        session_id,
                        pattern_map[pattern['pattern_name']],
                        pattern['start_time'],
                        pattern['end_time'],
                        pattern['confidence']
                    ))

            self.connection.commit()
            logger.info(f"Saved {len(patterns)} detected patterns for session {session_id}")

    def _save_tempo_map(self, session_id: int, map_data: List[Dict]):
        """Save tempo map visualization data"""
        with self.connection.cursor() as cursor:
            # Delete existing map data
            cursor.execute("DELETE FROM mdl_thinking_tempo_map_data WHERE session_id = %s", (session_id,))

            # Insert new data
            for bucket in map_data:
                sql = """
                    INSERT INTO mdl_thinking_tempo_map_data
                    (session_id, time_bucket, bucket_start, bucket_end, tempo_score,
                     activity_level, dominant_event_type, event_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    session_id,
                    bucket['time_bucket'],
                    bucket['bucket_start'],
                    bucket['bucket_end'],
                    bucket['tempo_score'],
                    bucket['activity_level'],
                    bucket['dominant_event_type'],
                    bucket['event_count']
                ))

            self.connection.commit()
            logger.info(f"Saved {len(map_data)} tempo map buckets for session {session_id}")


if __name__ == '__main__':
    # Example usage
    db_config = {
        'host': 'localhost',
        'user': 'moodle',
        'password': 'moodle',
        'database': 'moodle'
    }

    analyzer = TempoAnalyzer(db_config)
    analyzer.connect()

    try:
        # Analyze session (replace with actual session ID)
        session_id = 1
        results = analyzer.analyze_session(session_id)
        print(json.dumps(results, indent=2, default=str))
    finally:
        analyzer.close()
