package com.classreminder.utils

import com.classreminder.models.Course
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * LMS에서 시간표를 파싱하는 클래스
 *
 * 주의: 이 클래스는 일반적인 LMS 구조를 가정한 예시입니다.
 * 실제 사용하는 LMS의 구조에 맞게 수정이 필요합니다.
 */
class LmsParser {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    /**
     * LMS 로그인
     */
    suspend fun login(lmsUrl: String, username: String, password: String): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val formBody = FormBody.Builder()
                    .add("username", username)
                    .add("password", password)
                    .build()

                val request = Request.Builder()
                    .url("$lmsUrl/login")
                    .post(formBody)
                    .build()

                val response = client.newCall(request).execute()
                response.isSuccessful
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
    }

    /**
     * 시간표 가져오기
     *
     * 이 메서드는 예시입니다. 실제 LMS의 API 구조에 맞게 수정해야 합니다.
     */
    suspend fun fetchTimetable(lmsUrl: String): List<Course> {
        return withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("$lmsUrl/api/timetable")
                    .get()
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string() ?: return@withContext emptyList()

                parseTimetableJson(responseBody)
            } catch (e: Exception) {
                e.printStackTrace()
                emptyList()
            }
        }
    }

    /**
     * JSON 형식의 시간표 파싱
     *
     * 예상 JSON 형식:
     * [
     *   {
     *     "id": "CS101",
     *     "name": "컴퓨터과학개론",
     *     "instructor": "홍길동",
     *     "room": "공학관 101",
     *     "dayOfWeek": "MONDAY",
     *     "startTime": "09:00",
     *     "endTime": "10:30"
     *   }
     * ]
     */
    private fun parseTimetableJson(json: String): List<Course> {
        val courses = mutableListOf<Course>()
        try {
            val jsonArray = JSONArray(json)
            for (i in 0 until jsonArray.length()) {
                val jsonObject = jsonArray.getJSONObject(i)
                val course = parseCourseFromJson(jsonObject)
                course?.let { courses.add(it) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return courses
    }

    /**
     * JSON 객체를 Course 객체로 변환
     */
    private fun parseCourseFromJson(jsonObject: JSONObject): Course? {
        return try {
            val id = jsonObject.getString("id")
            val name = jsonObject.getString("name")
            val instructor = jsonObject.getString("instructor")
            val room = jsonObject.getString("room")
            val dayOfWeekString = jsonObject.getString("dayOfWeek")
            val startTime = jsonObject.getString("startTime")
            val endTime = jsonObject.getString("endTime")

            val dayOfWeek = parseDayOfWeek(dayOfWeekString)
            val (startHour, startMinute) = parseTime(startTime)
            val (endHour, endMinute) = parseTime(endTime)

            Course(
                id = id,
                name = name,
                instructor = instructor,
                room = room,
                dayOfWeek = dayOfWeek,
                startHour = startHour,
                startMinute = startMinute,
                endHour = endHour,
                endMinute = endMinute
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * 요일 문자열을 Calendar 상수로 변환
     */
    private fun parseDayOfWeek(dayString: String): Int {
        return when (dayString.uppercase()) {
            "MONDAY", "월", "월요일" -> Calendar.MONDAY
            "TUESDAY", "화", "화요일" -> Calendar.TUESDAY
            "WEDNESDAY", "수", "수요일" -> Calendar.WEDNESDAY
            "THURSDAY", "목", "목요일" -> Calendar.THURSDAY
            "FRIDAY", "금", "금요일" -> Calendar.FRIDAY
            "SATURDAY", "토", "토요일" -> Calendar.SATURDAY
            "SUNDAY", "일", "일요일" -> Calendar.SUNDAY
            else -> Calendar.MONDAY
        }
    }

    /**
     * 시간 문자열을 (시, 분) 쌍으로 변환
     * 예: "09:00" -> (9, 0)
     */
    private fun parseTime(timeString: String): Pair<Int, Int> {
        val parts = timeString.split(":")
        val hour = parts[0].toIntOrNull() ?: 0
        val minute = if (parts.size > 1) parts[1].toIntOrNull() ?: 0 else 0
        return Pair(hour, minute)
    }

    /**
     * 샘플 시간표 데이터 생성 (테스트용)
     */
    fun getSampleTimetable(): List<Course> {
        return listOf(
            Course(
                id = "CS101",
                name = "컴퓨터과학개론",
                instructor = "김교수",
                room = "공학관 101",
                dayOfWeek = Calendar.MONDAY,
                startHour = 9,
                startMinute = 0,
                endHour = 10,
                endMinute = 30,
                color = "#FF6B6B"
            ),
            Course(
                id = "MATH201",
                name = "선형대수학",
                instructor = "이교수",
                room = "자연관 205",
                dayOfWeek = Calendar.TUESDAY,
                startHour = 13,
                startMinute = 0,
                endHour = 14,
                endMinute = 30,
                color = "#4ECDC4"
            ),
            Course(
                id = "ENG301",
                name = "영어회화",
                instructor = "박교수",
                room = "인문관 302",
                dayOfWeek = Calendar.WEDNESDAY,
                startHour = 10,
                startMinute = 30,
                endHour = 12,
                endMinute = 0,
                color = "#45B7D1"
            ),
            Course(
                id = "PHY101",
                name = "물리학실험",
                instructor = "최교수",
                room = "과학관 401",
                dayOfWeek = Calendar.THURSDAY,
                startHour = 14,
                startMinute = 0,
                endHour = 17,
                endMinute = 0,
                color = "#F7DC6F"
            ),
            Course(
                id = "CS202",
                name = "자료구조",
                instructor = "정교수",
                room = "공학관 203",
                dayOfWeek = Calendar.FRIDAY,
                startHour = 11,
                startMinute = 0,
                endHour = 12,
                endMinute = 30,
                color = "#BB8FCE"
            )
        )
    }
}
