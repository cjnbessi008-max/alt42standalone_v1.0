"""
DMN Dropout Detection Engine
Core logic for detecting student dropout signals

Detects:
- Inactivity (mouse, keyboard)
- Page visibility loss
- Abnormal response patterns
- Random/repetitive clicking
- Accuracy drops
"""

from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger('dmn_api.detector')


class DropoutDetector:
    """Detects DMN dropout signals from student behavior"""

    def __init__(self, config, db):
        self.config = config
        self.db = db

        # Load thresholds from config
        self.thresholds = {
            'inactivity_warning': int(config.get('inactivity_warning_threshold_seconds', 300)),
            'inactivity_critical': int(config.get('inactivity_critical_threshold_seconds', 600)),
            'page_hidden': int(config.get('page_hidden_threshold_seconds', 120)),
            'page_switch_count': int(config.get('page_switch_count_threshold', 5)),
            'response_too_fast_ratio': float(config.get('response_too_fast_ratio', 0.2)),
            'response_too_slow_ratio': float(config.get('response_too_slow_ratio', 3.0)),
            'accuracy_drop_threshold': float(config.get('accuracy_drop_threshold', 0.5)),
            'random_click_count': int(config.get('random_click_count_threshold', 20)),
            'repetitive_click_count': int(config.get('repetitive_click_count_threshold', 10))
        }

        logger.info(f"Dropout detector initialized with thresholds: {self.thresholds}")

    def check_for_dropout(self, session_id, event_type, event_data):
        """
        Check if event indicates a dropout signal

        Returns:
            list: List of dropout events detected
        """
        dropout_events = []

        # Check different dropout types based on event type
        if event_type == 'mouse_inactive':
            dropout_events.extend(self._check_inactivity(session_id, event_data, 'mouse'))

        elif event_type == 'key_inactive':
            dropout_events.extend(self._check_inactivity(session_id, event_data, 'keyboard'))

        elif event_type == 'page_hidden':
            dropout_events.extend(self._check_page_visibility(session_id, event_data))

        elif event_type == 'page_visible':
            dropout_events.extend(self._check_page_switch_frequency(session_id))

        elif event_type == 'problem_submitted':
            dropout_events.extend(self._check_response_pattern(session_id, event_data))
            dropout_events.extend(self._check_accuracy_pattern(session_id, event_data))

        elif event_type == 'random_clicks':
            dropout_events.extend(self._detect_random_clicking(session_id, event_data))

        elif event_type == 'repetitive_clicking':
            dropout_events.extend(self._detect_repetitive_clicking(session_id, event_data))

        # Store dropout events in database
        for dropout_event in dropout_events:
            self.db.store_dropout_event(dropout_event)

        return dropout_events

    def _check_inactivity(self, session_id, event_data, inactivity_type):
        """Check for inactivity-based dropout signals"""
        dropout_events = []

        duration = event_data.get('duration', 0) / 1000  # Convert to seconds

        # Check against thresholds
        if duration >= self.thresholds['inactivity_critical']:
            # Critical inactivity (10+ minutes)
            dropout_events.append({
                'session_id': session_id,
                'dropout_type': 'inactivity_10min',
                'severity_level': 'high',
                'detected_at': datetime.now(),
                'detection_data': {
                    'inactivity_type': inactivity_type,
                    'duration_seconds': duration,
                    'threshold': self.thresholds['inactivity_critical']
                }
            })
            logger.warning(f"Critical inactivity detected: {duration}s in session {session_id}")

        elif duration >= self.thresholds['inactivity_warning']:
            # Warning inactivity (5+ minutes)
            dropout_events.append({
                'session_id': session_id,
                'dropout_type': 'inactivity_5min',
                'severity_level': 'medium',
                'detected_at': datetime.now(),
                'detection_data': {
                    'inactivity_type': inactivity_type,
                    'duration_seconds': duration,
                    'threshold': self.thresholds['inactivity_warning']
                }
            })
            logger.info(f"Inactivity warning: {duration}s in session {session_id}")

        return dropout_events

    def _check_page_visibility(self, session_id, event_data):
        """Check for prolonged page hiding"""
        dropout_events = []

        # Get session info
        session = self.db.get_session(session_id)
        if not session:
            return dropout_events

        # Check if page was hidden for too long
        # This will be detected when page becomes visible again
        return dropout_events

    def _check_page_switch_frequency(self, session_id):
        """Check for frequent page switching"""
        dropout_events = []

        # Count page switches in last hour
        one_hour_ago = datetime.now() - timedelta(hours=1)
        page_switch_count = self.db.count_events_since(
            session_id,
            event_type='page_hidden',
            since=one_hour_ago
        )

        if page_switch_count >= self.thresholds['page_switch_count']:
            dropout_events.append({
                'session_id': session_id,
                'dropout_type': 'page_switch_frequent',
                'severity_level': 'medium',
                'detected_at': datetime.now(),
                'detection_data': {
                    'switch_count': page_switch_count,
                    'time_window': 3600,
                    'threshold': self.thresholds['page_switch_count']
                }
            })
            logger.info(f"Frequent page switching detected: {page_switch_count} times in session {session_id}")

        return dropout_events

    def _check_response_pattern(self, session_id, event_data):
        """Check for abnormal response time patterns"""
        dropout_events = []

        problem_duration = event_data.get('duration', 0) / 1000  # Convert to seconds

        # Get average problem duration for this session
        avg_duration = self.db.get_average_problem_duration(session_id)

        if avg_duration and avg_duration > 0:
            ratio = problem_duration / avg_duration

            # Too fast (suspicious random answering)
            if ratio < self.thresholds['response_too_fast_ratio']:
                dropout_events.append({
                    'session_id': session_id,
                    'dropout_type': 'response_too_fast',
                    'severity_level': 'medium',
                    'detected_at': datetime.now(),
                    'detection_data': {
                        'duration_seconds': problem_duration,
                        'average_duration': avg_duration,
                        'ratio': ratio,
                        'threshold': self.thresholds['response_too_fast_ratio']
                    }
                })
                logger.warning(f"Suspiciously fast response in session {session_id}: {problem_duration}s vs avg {avg_duration}s")

            # Too slow (distraction/confusion)
            elif ratio > self.thresholds['response_too_slow_ratio']:
                dropout_events.append({
                    'session_id': session_id,
                    'dropout_type': 'response_too_slow',
                    'severity_level': 'low',
                    'detected_at': datetime.now(),
                    'detection_data': {
                        'duration_seconds': problem_duration,
                        'average_duration': avg_duration,
                        'ratio': ratio,
                        'threshold': self.thresholds['response_too_slow_ratio']
                    }
                })
                logger.info(f"Slow response in session {session_id}: {problem_duration}s vs avg {avg_duration}s")

        return dropout_events

    def _check_accuracy_pattern(self, session_id, event_data):
        """Check for accuracy drops"""
        dropout_events = []

        is_correct = event_data.get('isCorrect', False)

        # Get recent accuracy (last 5 problems)
        recent_problems = self.db.get_recent_problems(session_id, limit=5)

        if len(recent_problems) >= 5:
            recent_accuracy = sum(1 for p in recent_problems if p.get('isCorrect')) / len(recent_problems)

            # Get historical accuracy (before last 5)
            historical_problems = self.db.get_recent_problems(session_id, limit=20, offset=5)

            if len(historical_problems) >= 5:
                historical_accuracy = sum(1 for p in historical_problems if p.get('isCorrect')) / len(historical_problems)

                # Check for significant drop
                if historical_accuracy > 0.5 and recent_accuracy < historical_accuracy * self.thresholds['accuracy_drop_threshold']:
                    dropout_events.append({
                        'session_id': session_id,
                        'dropout_type': 'accuracy_drop',
                        'severity_level': 'high',
                        'detected_at': datetime.now(),
                        'detection_data': {
                            'recent_accuracy': recent_accuracy,
                            'historical_accuracy': historical_accuracy,
                            'drop_ratio': recent_accuracy / historical_accuracy if historical_accuracy > 0 else 0,
                            'threshold': self.thresholds['accuracy_drop_threshold']
                        }
                    })
                    logger.warning(f"Accuracy drop detected in session {session_id}: {recent_accuracy:.2f} vs {historical_accuracy:.2f}")

        return dropout_events

    def _detect_random_clicking(self, session_id, event_data):
        """Detect random clicking behavior"""
        dropout_events = []

        click_count = event_data.get('clickCount', 0)
        time_window = event_data.get('timeWindow', 30000) / 1000  # Convert to seconds

        if click_count >= self.thresholds['random_click_count']:
            dropout_events.append({
                'session_id': session_id,
                'dropout_type': 'random_clicking',
                'severity_level': 'medium',
                'detected_at': datetime.now(),
                'detection_data': {
                    'click_count': click_count,
                    'time_window_seconds': time_window,
                    'threshold': self.thresholds['random_click_count']
                }
            })
            logger.warning(f"Random clicking detected in session {session_id}: {click_count} clicks in {time_window}s")

        return dropout_events

    def _detect_repetitive_clicking(self, session_id, event_data):
        """Detect repetitive clicking in same location"""
        dropout_events = []

        click_count = event_data.get('clickCount', 0)
        location = event_data.get('location', 'unknown')

        if click_count >= self.thresholds['repetitive_click_count']:
            dropout_events.append({
                'session_id': session_id,
                'dropout_type': 'repetitive_clicking',
                'severity_level': 'low',
                'detected_at': datetime.now(),
                'detection_data': {
                    'click_count': click_count,
                    'location': location,
                    'threshold': self.thresholds['repetitive_click_count']
                }
            })
            logger.info(f"Repetitive clicking detected in session {session_id}: {click_count} clicks at {location}")

        return dropout_events

    def get_session_risk_score(self, session_id):
        """
        Calculate overall risk score for a session

        Returns:
            float: Risk score from 0 (no risk) to 1 (high risk)
        """
        # Get dropout events for session
        dropout_events = self.db.get_session_dropout_events(session_id)

        if not dropout_events:
            return 0.0

        # Weight dropout types by severity
        severity_weights = {
            'low': 0.2,
            'medium': 0.5,
            'high': 1.0
        }

        total_score = 0
        for event in dropout_events:
            severity = event.get('severity_level', 'medium')
            total_score += severity_weights.get(severity, 0.5)

        # Normalize to 0-1 range (cap at 1.0)
        risk_score = min(total_score / 10.0, 1.0)

        return risk_score
