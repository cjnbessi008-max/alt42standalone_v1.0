"""
테스트 데이터 생성 스크립트

사용법:
docker exec -it lms-backend python create_test_data.py
"""

import requests
from datetime import datetime, timedelta
import random
import sys

API_URL = "http://localhost:8000/api"


def create_students(count=10):
    """학생 데이터 생성"""
    print(f"\n학생 {count}명 생성 중...")
    students = []

    for i in range(1, count + 1):
        student = {
            "name": f"학생{i}",
            "email": f"student{i}@example.com",
            "student_id": f"S{i:04d}"
        }
        try:
            response = requests.post(f"{API_URL}/students", json=student)
            if response.status_code == 200:
                students.append(response.json())
                print(f"  ✓ {student['name']} 생성 완료")
            else:
                print(f"  ✗ {student['name']} 생성 실패: {response.status_code}")
        except Exception as e:
            print(f"  ✗ 오류: {e}")

    return students


def create_courses(count=3):
    """과정 데이터 생성"""
    print(f"\n과정 {count}개 생성 중...")
    courses = []
    course_names = ["수학", "과학", "영어", "역사", "프로그래밍"]

    for i in range(1, count + 1):
        course = {
            "name": f"{course_names[i-1] if i <= len(course_names) else f'과정{i}'}",
            "code": f"COURSE{i:03d}",
            "description": f"테스트 과정 {i}"
        }
        try:
            response = requests.post(f"{API_URL}/courses", json=course)
            if response.status_code == 200:
                courses.append(response.json())
                print(f"  ✓ {course['name']} 생성 완료")
            else:
                print(f"  ✗ {course['name']} 생성 실패: {response.status_code}")
        except Exception as e:
            print(f"  ✗ 오류: {e}")

    return courses


def create_incidents(students, courses, days=7):
    """사고 데이터 생성"""
    print(f"\n최근 {days}일간 사고 데이터 생성 중...")

    incident_types = [
        "learning_activity",
        "assessment",
        "system_error",
        "login",
        "content_access",
        "submission",
        "discussion"
    ]

    severities = ["info", "warning", "error", "critical"]
    severity_weights = [0.7, 0.2, 0.08, 0.02]  # 심각도별 가중치

    total_incidents = 0

    for day in range(days):
        date = datetime.now() - timedelta(days=day)
        daily_count = random.randint(30, 80)

        incidents = []

        for _ in range(daily_count):
            incident_type = random.choice(incident_types)

            # 오류 타입은 더 높은 심각도 가능성
            if incident_type == "system_error":
                severity = random.choices(
                    severities,
                    weights=[0.3, 0.3, 0.3, 0.1]
                )[0]
            else:
                severity = random.choices(severities, weights=severity_weights)[0]

            # 메타데이터 생성
            metadata = {}
            if incident_type == "assessment":
                metadata = {
                    "score": random.randint(0, 100),
                    "max_score": 100,
                    "duration_minutes": random.randint(10, 60)
                }
            elif incident_type == "submission":
                metadata = {
                    "assignment_id": random.randint(1, 20),
                    "file_count": random.randint(1, 5)
                }

            incident = {
                "type": incident_type,
                "severity": severity,
                "title": f"{incident_type.replace('_', ' ').title()} - {random.randint(1000, 9999)}",
                "description": "자동 생성된 테스트 데이터",
                "student_id": random.choice(students)["id"] if students else None,
                "course_id": random.choice(courses)["id"] if courses else None,
                "metadata": metadata
            }
            incidents.append(incident)

        # 일괄 생성
        try:
            response = requests.post(f"{API_URL}/incidents/batch", json=incidents)
            if response.status_code == 200:
                created = response.json()["created"]
                total_incidents += created
                print(f"  ✓ {date.strftime('%Y-%m-%d')}: {created}개 사고 생성")
            else:
                print(f"  ✗ {date.strftime('%Y-%m-%d')}: 생성 실패")
        except Exception as e:
            print(f"  ✗ 오류: {e}")

    print(f"\n총 {total_incidents}개 사고 생성 완료")
    return total_incidents


def generate_reports(days=7):
    """일일 리포트 생성"""
    print(f"\n최근 {days}일 리포트 생성 중...")

    for day in range(1, days + 1):
        date = (datetime.now() - timedelta(days=day)).strftime("%Y-%m-%d")

        try:
            response = requests.post(
                f"{API_URL}/reports/generate",
                params={"report_date": date}
            )
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ {date}: 리포트 생성 완료 (사고 {result['incidents_count']}개)")
            else:
                print(f"  ✗ {date}: 리포트 생성 실패")
        except Exception as e:
            print(f"  ✗ 오류: {e}")


def main():
    print("=" * 60)
    print("LMS 일일 리포트 시스템 - 테스트 데이터 생성")
    print("=" * 60)

    # 1. 학생 생성
    students = create_students(10)

    # 2. 과정 생성
    courses = create_courses(5)

    # 3. 사고 생성
    if students and courses:
        create_incidents(students, courses, days=7)

        # 4. 리포트 생성
        generate_reports(days=7)

        print("\n" + "=" * 60)
        print("✓ 테스트 데이터 생성 완료!")
        print("=" * 60)
        print("\n접속 URL:")
        print("  - 프론트엔드: http://localhost:3000")
        print("  - API 문서: http://localhost:8000/docs")
        print("=" * 60)
    else:
        print("\n✗ 학생 또는 과정 데이터 생성 실패")
        sys.exit(1)


if __name__ == "__main__":
    main()
