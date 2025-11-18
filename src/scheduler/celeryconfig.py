"""
Celery Configuration
====================
Configuration for Celery task scheduler with beat schedule.

Author: AI Agent (Claude)
Date: 2025-11-18
Version: 1.0.0
"""

import os
from celery.schedules import crontab
from kombu import Exchange, Queue


# ============================================================================
# Broker and Backend Configuration
# ============================================================================

# Redis as message broker
broker_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Redis as result backend
result_backend = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Task result expiration (24 hours)
result_expires = 86400


# ============================================================================
# Timezone Configuration
# ============================================================================

# Use Korea Standard Time
timezone = 'Asia/Seoul'

# Enable UTC
enable_utc = False


# ============================================================================
# Serialization Configuration
# ============================================================================

# Use JSON for task serialization (safer than pickle)
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'


# ============================================================================
# Task Execution Configuration
# ============================================================================

# Track task start time
task_track_started = True

# Task timeout (1 hour max per task)
task_time_limit = 3600

# Soft time limit (warning before hard limit)
task_soft_time_limit = 3300  # 55 minutes

# Acknowledge tasks after execution (not before)
task_acks_late = True

# Reject task on worker shutdown and requeue
task_reject_on_worker_lost = True

# Number of concurrent workers
worker_concurrency = 4

# Prefetch multiplier (how many tasks to prefetch per worker)
worker_prefetch_multiplier = 1

# Max tasks per worker before restart (prevent memory leaks)
worker_max_tasks_per_child = 100


# ============================================================================
# Beat Schedule (Periodic Tasks)
# ============================================================================

beat_schedule = {
    # Daily quality score evaluation at 02:00 KST
    'daily-quality-evaluation': {
        'task': 'scheduler.celery_tasks.evaluate_daily_quality_scores',
        'schedule': crontab(hour=2, minute=0),  # 02:00 KST daily
        'options': {
            'expires': 7200,  # Expire after 2 hours if not picked up
        }
    },

    # Weekly student roster sync on Monday at 01:00 KST
    'weekly-student-roster-sync': {
        'task': 'scheduler.celery_tasks.sync_student_roster',
        'schedule': crontab(hour=1, minute=0, day_of_week=1),  # Monday 01:00
        'options': {
            'expires': 3600,
        }
    },

    # Optional: Hourly sync for testing (comment out in production)
    # 'hourly-test-sync': {
    #     'task': 'scheduler.celery_tasks.sync_student_roster',
    #     'schedule': crontab(minute=0),  # Every hour
    # },
}


# ============================================================================
# Queue Configuration
# ============================================================================

# Define task queues
task_queues = (
    Queue('default', Exchange('default'), routing_key='default'),
    Queue('evaluation', Exchange('evaluation'), routing_key='evaluation'),
    Queue('sync', Exchange('sync'), routing_key='sync'),
)

# Default queue
task_default_queue = 'default'
task_default_exchange = 'default'
task_default_routing_key = 'default'

# Route tasks to specific queues
task_routes = {
    'scheduler.celery_tasks.evaluate_daily_quality_scores': {
        'queue': 'evaluation',
        'routing_key': 'evaluation',
    },
    'scheduler.celery_tasks.sync_student_roster': {
        'queue': 'sync',
        'routing_key': 'sync',
    },
}


# ============================================================================
# Monitoring Configuration
# ============================================================================

# Send task events for monitoring
worker_send_task_events = True

# Task event queue expires after 1 minute
event_queue_expires = 60

# Send task sent events
task_send_sent_event = True


# ============================================================================
# Error Handling Configuration
# ============================================================================

# Max retries for failed tasks
task_max_retries = 3

# Default retry delay (seconds)
task_default_retry_delay = 300  # 5 minutes

# Exponential backoff
task_autoretry_for = (Exception,)


# ============================================================================
# Logging Configuration
# ============================================================================

# Worker log format
worker_log_format = '[%(asctime)s: %(levelname)s/%(processName)s] %(message)s'
worker_task_log_format = '[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s'


# ============================================================================
# Performance Optimization
# ============================================================================

# Optimize broker connection pool
broker_pool_limit = 10

# Heartbeat frequency (seconds)
broker_heartbeat = 30

# Connection timeout
broker_connection_timeout = 10

# Connection retry on startup
broker_connection_retry_on_startup = True

# Compress task messages (for large payloads)
task_compression = 'gzip'

# Result backend connection pool
result_backend_max_retries = 10


# ============================================================================
# Additional Configuration
# ============================================================================

# Include custom headers in task metadata
task_protocol = 2  # Use newer protocol version

# Store task results even if task failed
task_store_errors_even_if_ignored = True

# Ignore results for certain tasks (to save memory)
task_ignore_result = False

# Task result extended metadata
result_extended = True


# ============================================================================
# Celery Beat Configuration
# ============================================================================

# Beat scheduler
beat_scheduler = 'celery.beat:PersistentScheduler'

# Beat schedule filename
beat_schedule_filename = '/tmp/celerybeat-schedule'


# ============================================================================
# Environment-specific Configuration
# ============================================================================

# Load environment-specific settings
ENV = os.getenv('ENVIRONMENT', 'development')

if ENV == 'production':
    # Production settings
    worker_concurrency = 8
    worker_prefetch_multiplier = 2
    task_time_limit = 7200  # 2 hours for production

elif ENV == 'development':
    # Development settings
    worker_concurrency = 2
    task_always_eager = False  # Set to True to run tasks synchronously for debugging

elif ENV == 'testing':
    # Testing settings
    task_always_eager = True  # Run tasks synchronously in tests
    task_eager_propagates = True  # Propagate exceptions in eager mode
    broker_url = 'memory://'  # Use in-memory broker for tests


# ============================================================================
# Custom Configuration
# ============================================================================

# Batch size for evaluation tasks
EVALUATION_BATCH_SIZE = int(os.getenv('BATCH_SIZE', 50))

# Days to look back for responses
EVALUATION_LOOKBACK_DAYS = int(os.getenv('LOOKBACK_DAYS', 1))

# Max responses to evaluate per job
MAX_RESPONSES_PER_JOB = int(os.getenv('MAX_RESPONSES', 1000))


# ============================================================================
# Security Configuration
# ============================================================================

# Disable pickle serialization (security risk)
accept_content = ['json']

# Require JSON serialization
task_serializer = 'json'
result_serializer = 'json'


print(f"Celery configuration loaded for environment: {ENV}")
print(f"Broker: {broker_url}")
print(f"Timezone: {timezone}")
print(f"Worker concurrency: {worker_concurrency}")
