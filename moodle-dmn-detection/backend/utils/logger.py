"""
Logging Configuration
Sets up logging for the application
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
import os


def setup_logger(name: str, level: str = 'INFO') -> logging.Logger:
    """
    Setup logger with console and file handlers

    Args:
        name: Logger name
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)

    # Convert level string to logging level
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # File handler (rotating)
    log_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'logs'
    )
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, f'{name}.log')
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(log_level)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
