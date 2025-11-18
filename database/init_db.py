#!/usr/bin/env python3
"""
Database initialization script
Runs migrations and sets up the database
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from backend.database import init_db, engine
from sqlalchemy import text


def run_migrations():
    """Run SQL migration scripts."""
    migrations_dir = Path(__file__).parent / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    print(f"Found {len(migration_files)} migration files")

    with engine.connect() as conn:
        for migration_file in migration_files:
            print(f"Running migration: {migration_file.name}")
            sql = migration_file.read_text()

            # Split by semicolon and execute each statement
            statements = [s.strip() for s in sql.split(';') if s.strip()]

            for statement in statements:
                try:
                    conn.execute(text(statement))
                except Exception as e:
                    print(f"Error executing statement: {e}")
                    print(f"Statement: {statement[:100]}...")

            conn.commit()
            print(f"✓ Migration {migration_file.name} completed")


def main():
    """Main initialization function."""
    print("Initializing database...")

    try:
        # Create tables using SQLAlchemy models
        print("Creating tables from models...")
        init_db()
        print("✓ Tables created")

        # Run SQL migrations
        print("\nRunning SQL migrations...")
        run_migrations()
        print("✓ Migrations completed")

        print("\n✓ Database initialization complete!")

    except Exception as e:
        print(f"\n✗ Error initializing database: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
