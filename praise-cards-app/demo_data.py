#!/usr/bin/env python3
"""
Demo data script for Praise Cards System
Creates sample students and learning sessions to demonstrate the system
"""

import requests
import time
import random

API_BASE = "http://localhost:8000/api/v1"

students_data = [
    {"name": "김민수", "email": "minsu@example.com", "grade_level": 5},
    {"name": "이서연", "email": "seoyeon@example.com", "grade_level": 6},
    {"name": "박지호", "email": "jiho@example.com", "grade_level": 4},
]

learning_sessions_scenarios = [
    # High accuracy scenario
    {
        "module_name": "수학 기초",
        "duration_minutes": 45,
        "questions_attempted": 20,
        "questions_correct": 18,
        "progress_percentage": 50.0,
    },
    # Long learning time scenario
    {
        "module_name": "영어 독해",
        "duration_minutes": 35,
        "questions_attempted": 15,
        "questions_correct": 12,
        "progress_percentage": 65.0,
    },
    # Module completion scenario
    {
        "module_name": "과학 탐구",
        "duration_minutes": 25,
        "questions_attempted": 10,
        "questions_correct": 9,
        "progress_percentage": 100.0,
    },
    # Perfect score scenario
    {
        "module_name": "사회 이해",
        "duration_minutes": 30,
        "questions_attempted": 20,
        "questions_correct": 20,
        "progress_percentage": 75.0,
    },
]


def create_students():
    """Create demo students"""
    print("Creating students...")
    student_ids = []

    for student_data in students_data:
        try:
            response = requests.post(f"{API_BASE}/students/", json=student_data)
            if response.status_code == 201:
                student = response.json()
                student_ids.append(student["id"])
                print(f"✅ Created student: {student['name']} (ID: {student['id']})")
            else:
                print(f"❌ Failed to create student {student_data['name']}: {response.text}")
        except Exception as e:
            print(f"❌ Error creating student {student_data['name']}: {e}")

    return student_ids


def create_learning_sessions(student_ids):
    """Create learning sessions for students"""
    print("\nCreating learning sessions and generating praise cards...")

    for i, student_id in enumerate(student_ids):
        # Each student completes 2-3 learning sessions
        num_sessions = random.randint(2, 3)
        scenarios = random.sample(learning_sessions_scenarios, num_sessions)

        for j, session_data in enumerate(scenarios):
            session_data["student_id"] = student_id

            try:
                response = requests.post(
                    f"{API_BASE}/learning-sessions/", json=session_data
                )
                if response.status_code == 201:
                    session = response.json()
                    print(
                        f"✅ Created session for student {i+1}: "
                        f"{session_data['module_name']} "
                        f"({session_data['questions_correct']}/{session_data['questions_attempted']} correct)"
                    )

                    # Small delay to allow card generation
                    time.sleep(0.5)
                else:
                    print(f"❌ Failed to create session: {response.text}")
            except Exception as e:
                print(f"❌ Error creating session: {e}")

            # Small delay between sessions
            time.sleep(0.3)


def check_praise_cards():
    """Check if praise cards were generated"""
    print("\nChecking praise cards...")

    try:
        response = requests.get(f"{API_BASE}/praise-cards/feed")
        if response.status_code == 200:
            feed = response.json()
            print(f"\n🎉 Total praise cards generated: {feed['total']}")

            if feed["cards"]:
                print("\nSample cards:")
                for card in feed["cards"][:3]:
                    print(f"\n📇 Card: {card['title']}")
                    print(f"   Student: {card.get('student', {}).get('name', 'Unknown')}")
                    print(f"   Message: {card['ai_message'][:80]}...")
                    print(f"   Design: {card['card_design']}")
        else:
            print(f"❌ Failed to fetch praise cards: {response.text}")
    except Exception as e:
        print(f"❌ Error fetching praise cards: {e}")


def main():
    print("=" * 60)
    print("Praise Cards System - Demo Data Generator")
    print("=" * 60)
    print("\nThis script will create sample data to demonstrate the system.")
    print("Make sure the backend is running on http://localhost:8000\n")

    input("Press Enter to continue...")

    # Create students
    student_ids = create_students()

    if not student_ids:
        print("\n❌ Failed to create students. Exiting.")
        return

    # Create learning sessions
    create_learning_sessions(student_ids)

    # Check generated praise cards
    time.sleep(1)
    check_praise_cards()

    print("\n" + "=" * 60)
    print("Demo data creation complete!")
    print("Visit http://localhost:3000 to see the praise cards feed")
    print("=" * 60)


if __name__ == "__main__":
    main()
