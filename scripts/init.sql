-- MySQL initialization script
-- This script is run when the MySQL container is first created

USE moodle_correlation;

-- Create indexes for better performance
ALTER TABLE students ADD INDEX idx_moodle_user_id (moodle_user_id);
ALTER TABLE courses ADD INDEX idx_moodle_course_id (moodle_course_id);
ALTER TABLE quizzes ADD INDEX idx_moodle_quiz_id (moodle_quiz_id);
ALTER TABLE quiz_attempts ADD INDEX idx_student_quiz (student_id, quiz_id);
ALTER TABLE reasoning_density_scores ADD INDEX idx_student_id (student_id);
ALTER TABLE reasoning_density_scores ADD INDEX idx_quiz_attempt_id (quiz_attempt_id);
ALTER TABLE correlation_analyses ADD INDEX idx_course_quiz (course_id, quiz_id);

-- Set character set to UTF-8
ALTER DATABASE moodle_correlation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
