# Dockerfile for Alt42 LMS Integration System

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY config/requirements.txt /app/config/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/config/requirements.txt

# Copy source code
COPY src/ /app/src/
COPY .env.example /app/.env.example

# Create logs directory
RUN mkdir -p /app/logs

# Expose API port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
