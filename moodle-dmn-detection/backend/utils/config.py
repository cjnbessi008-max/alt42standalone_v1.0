"""
Configuration Manager
Loads and manages application configuration
"""

import os
import yaml
import json
from typing import Any, Optional


class Config:
    """Configuration manager"""

    def __init__(self, config_path: str = None):
        """Load configuration from file"""
        self._config = {}

        # Default config path
        if not config_path:
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                'config',
                'config.yml'
            )

        # Load from file if exists
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self._config = yaml.safe_load(f) or {}

        # Override with environment variables
        self._load_env_overrides()

    def _load_env_overrides(self):
        """Load configuration from environment variables"""
        env_mappings = {
            'DB_HOST': 'db_host',
            'DB_PORT': 'db_port',
            'DB_NAME': 'db_name',
            'DB_USER': 'db_user',
            'DB_PASSWORD': 'db_password',
            'MOODLE_URL': 'moodle_url',
            'MOODLE_TOKEN': 'moodle_token',
            'API_PORT': 'api_port',
            'LOG_LEVEL': 'log_level',
            'DEBUG': 'debug'
        }

        for env_var, config_key in env_mappings.items():
            value = os.environ.get(env_var)
            if value:
                self._config[config_key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self._config.get(key, default)

    def set(self, key: str, value: Any):
        """Set configuration value"""
        self._config[key] = value

    def get_all(self) -> dict:
        """Get all configuration"""
        return self._config.copy()
