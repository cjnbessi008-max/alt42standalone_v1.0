"""
Claude API client for generating concept summaries
"""

import json
import os
from typing import Optional, Dict, Any
from anthropic import Anthropic, AsyncAnthropic
import logging

logger = logging.getLogger(__name__)


class ClaudeClient:
    """Client for interacting with Claude API"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude client

        Args:
            api_key: Anthropic API key. If not provided, will use ANTHROPIC_API_KEY env var
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be provided or set in environment")

        self.client = Anthropic(api_key=self.api_key)
        self.async_client = AsyncAnthropic(api_key=self.api_key)
        self.default_model = "claude-3-sonnet-20240229"
        self.max_tokens = 1024

    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate a completion from Claude (synchronous)

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use (defaults to claude-3-sonnet)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text response
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            response = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=messages
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error generating completion: {str(e)}")
            raise

    async def generate_completion_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate a completion from Claude (asynchronous)

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use (defaults to claude-3-sonnet)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text response
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            response = await self.async_client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=messages
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error generating async completion: {str(e)}")
            raise

    def generate_json_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate a JSON response from Claude

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use
            temperature: Sampling temperature

        Returns:
            Parsed JSON response as dictionary
        """
        response_text = self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature
        )

        try:
            # Try to extract JSON from response
            # Claude might wrap it in markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            return json.loads(response_text)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response_text}")
            logger.error(f"JSON decode error: {str(e)}")
            # Return a fallback structure
            return {
                "error": "Failed to parse JSON",
                "raw_response": response_text
            }

    async def generate_json_completion_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate a JSON response from Claude (asynchronous)

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use
            temperature: Sampling temperature

        Returns:
            Parsed JSON response as dictionary
        """
        response_text = await self.generate_completion_async(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature
        )

        try:
            # Try to extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            return json.loads(response_text)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response_text}")
            logger.error(f"JSON decode error: {str(e)}")
            return {
                "error": "Failed to parse JSON",
                "raw_response": response_text
            }
