package com.classreminder.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.classreminder.R
import com.classreminder.models.Course

/**
 * 수업 목록을 표시하는 RecyclerView 어댑터
 */
class CourseAdapter(
    private var courses: MutableList<Course>,
    private val onDeleteClick: (Course) -> Unit
) : RecyclerView.Adapter<CourseAdapter.CourseViewHolder>() {

    inner class CourseViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val colorIndicator: View = itemView.findViewById(R.id.viewColorIndicator)
        val textCourseName: TextView = itemView.findViewById(R.id.textCourseName)
        val textInstructor: TextView = itemView.findViewById(R.id.textInstructor)
        val textDayTime: TextView = itemView.findViewById(R.id.textDayTime)
        val textRoom: TextView = itemView.findViewById(R.id.textRoom)
        val btnDelete: Button = itemView.findViewById(R.id.btnDelete)

        fun bind(course: Course) {
            // 색상 인디케이터
            try {
                colorIndicator.setBackgroundColor(Color.parseColor(course.color))
            } catch (e: Exception) {
                colorIndicator.setBackgroundColor(Color.parseColor("#FF6B6B"))
            }

            // 수업 정보
            textCourseName.text = course.name
            textInstructor.text = "교수: ${course.instructor}"
            textDayTime.text = "${course.getDayName()} ${course.getTimeString()}"
            textRoom.text = "강의실: ${course.room}"

            // 삭제 버튼
            btnDelete.setOnClickListener {
                onDeleteClick(course)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CourseViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_course, parent, false)
        return CourseViewHolder(view)
    }

    override fun onBindViewHolder(holder: CourseViewHolder, position: Int) {
        holder.bind(courses[position])
    }

    override fun getItemCount(): Int = courses.size

    /**
     * 수업 목록 업데이트
     */
    fun updateCourses(newCourses: List<Course>) {
        courses.clear()
        courses.addAll(newCourses)
        notifyDataSetChanged()
    }

    /**
     * 수업 삭제
     */
    fun removeCourse(course: Course) {
        val position = courses.indexOf(course)
        if (position != -1) {
            courses.removeAt(position)
            notifyItemRemoved(position)
        }
    }
}
