#!/bin/bash
# Database initialization script
# This script initializes the database with schema and sample data

set -e

echo "Initializing database..."

# Wait for PostgreSQL to be ready
until pg_isready -h db -U postgres; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Run migrations
echo "Running migrations..."
psql -h db -U postgres -d ai_education -f /docker-entrypoint-initdb.d/migrations/001_create_base_tables.sql

# Run seeds
echo "Loading sample data..."
psql -h db -U postgres -d ai_education -f /docker-entrypoint-initdb.d/seeds/002_sample_data.sql

echo "Database initialization complete!"
