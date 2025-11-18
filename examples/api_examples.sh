#!/bin/bash
# API Usage Examples using curl
# Make sure to update the API_KEY and BASE_URL

API_KEY="your-api-key-here"
BASE_URL="http://localhost/api"

echo "=== Moodle Gap Detection API Examples ==="
echo ""

# Example 1: Get gaps for a specific student
echo "1. Get gaps for student 123 in course 1"
curl -X GET "${BASE_URL}/gaps.php/student/123/course/1" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
echo -e "\n"

# Example 2: Get all gaps for a student (all courses)
echo "2. Get all gaps for student 123"
curl -X GET "${BASE_URL}/gaps.php/student/123" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
echo -e "\n"

# Example 3: Get gap statistics for a course
echo "3. Get gap statistics for course 1"
curl -X GET "${BASE_URL}/gaps.php/course/1/statistics" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
echo -e "\n"

# Example 4: Get all gaps in a course
echo "4. Get all gaps in course 1"
curl -X GET "${BASE_URL}/gaps.php/course/1" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
echo -e "\n"

# Example 5: Get gap summary
echo "5. Get gap summary (all courses)"
curl -X GET "${BASE_URL}/gaps.php/summary" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
echo -e "\n"

# Example 6: Analyze a specific student
echo "6. Analyze student 123 in course 1"
curl -X POST "${BASE_URL}/gaps.php/analyze" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "user_id": 123,
    "concept_map": {
      "fractions_basic": ["fraction", "분수", "numerator"],
      "fractions_multiplication": ["fraction multiply", "분수 곱셈"],
      "multiplication_basic": ["multiplication", "곱셈"]
    }
  }'
echo -e "\n"

# Example 7: Sync course data from Moodle
echo "7. Sync course 1 from Moodle"
curl -X POST "${BASE_URL}/sync.php" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "sync_type": "manual",
    "batch_size": 50
  }'
echo -e "\n"

# Example 8: Scheduled sync
echo "8. Scheduled sync for course 1"
curl -X POST "${BASE_URL}/sync.php" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "sync_type": "scheduled"
  }'
echo -e "\n"

echo "=== Examples Complete ==="
