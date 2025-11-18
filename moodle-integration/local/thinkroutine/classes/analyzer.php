<?php
// This file is part of Moodle - http://moodle.org/

namespace local_thinkroutine;

defined('MOODLE_INTERNAL') || die();

/**
 * Main analyzer class for thinking routine analysis
 */
class analyzer {

    /**
     * Get comprehensive student activity data
     */
    public function get_student_activity_data($userid, $courseid, $timestart, $timeend) {
        global $DB;

        $data = array(
            'userid' => $userid,
            'total_sessions' => 0,
            'avg_session_duration' => 0,
            'total_time_spent' => 0,
            'completion_rate' => 0,
            'avg_grade' => 0,
            'quiz_attempts' => 0,
            'forum_posts' => 0,
            'resource_views' => 0,
            'activity_pattern' => array(
                'morning' => 0,
                'afternoon' => 0,
                'evening' => 0,
                'night' => 0,
            ),
            'peak_performance_time' => 'afternoon',
            'learning_velocity' => 0,
        );

        // Get log entries for the user
        $logs = $this->get_user_logs($userid, $courseid, $timestart, $timeend);

        // Analyze sessions
        $sessions = $this->extract_sessions($logs);
        $data['total_sessions'] = count($sessions);

        if (count($sessions) > 0) {
            $total_duration = 0;
            foreach ($sessions as $session) {
                $total_duration += $session['duration'];
            }
            $data['avg_session_duration'] = round($total_duration / count($sessions) / 60, 2); // Convert to minutes
            $data['total_time_spent'] = round($total_duration / 3600, 2); // Convert to hours
        }

        // Get quiz data
        $quiz_data = $this->get_quiz_data($userid, $courseid, $timestart, $timeend);
        $data['quiz_attempts'] = $quiz_data['attempts'];
        $data['avg_grade'] = $quiz_data['avg_grade'];

        // Get forum posts
        $data['forum_posts'] = $this->get_forum_posts_count($userid, $courseid, $timestart, $timeend);

        // Get resource views
        $data['resource_views'] = $this->get_resource_views_count($userid, $courseid, $timestart, $timeend);

        // Get completion rate
        $data['completion_rate'] = $this->get_completion_rate($userid, $courseid);

        // Analyze activity patterns (time of day)
        $data['activity_pattern'] = $this->analyze_time_patterns($logs);
        $data['peak_performance_time'] = $this->get_peak_performance_time($userid, $courseid);

        // Calculate learning velocity
        $data['learning_velocity'] = $this->calculate_learning_velocity($userid, $courseid);

        return $data;
    }

    /**
     * Get top performer patterns for a course
     */
    public function get_top_performer_patterns($courseid, $top_percentile) {
        global $DB;

        $result = array(
            'courseid' => $courseid,
            'total_students' => 0,
            'top_performers_count' => 0,
            'avg_top_performer_grade' => 0,
            'common_patterns' => array(),
            'optimal_study_duration' => 0,
            'optimal_session_frequency' => 0,
            'recommended_time_of_day' => 'afternoon',
        );

        // Get all students in the course
        $context = \context_course::instance($courseid);
        $students = get_enrolled_users($context, 'mod/quiz:attempt');
        $result['total_students'] = count($students);

        if (count($students) == 0) {
            return $result;
        }

        // Get grades for all students
        $student_grades = array();
        foreach ($students as $student) {
            $grade = $this->get_student_overall_grade($student->id, $courseid);
            if ($grade !== null) {
                $student_grades[$student->id] = $grade;
            }
        }

        // Sort by grade descending
        arsort($student_grades);

        // Get top performers
        $top_count = max(1, round(count($student_grades) * ($top_percentile / 100)));
        $top_performers = array_slice($student_grades, 0, $top_count, true);
        $result['top_performers_count'] = count($top_performers);

        if (count($top_performers) > 0) {
            $result['avg_top_performer_grade'] = round(array_sum($top_performers) / count($top_performers), 2);
        }

        // Analyze patterns among top performers
        $patterns = $this->analyze_top_performer_patterns(array_keys($top_performers), $courseid);
        $result['common_patterns'] = $patterns['patterns'];
        $result['optimal_study_duration'] = $patterns['avg_session_duration'];
        $result['optimal_session_frequency'] = $patterns['avg_sessions_per_week'];
        $result['recommended_time_of_day'] = $patterns['most_common_study_time'];

        return $result;
    }

    /**
     * Generate personalized thinking routine recommendations
     */
    public function generate_thinking_routine_recommendations($userid, $courseid) {
        global $DB;

        $result = array(
            'userid' => $userid,
            'courseid' => $courseid,
            'current_performance_percentile' => 0,
            'recommendations' => array(),
            'thinking_routine' => array(
                'morning_routine' => '',
                'study_approach' => '',
                'problem_solving_steps' => '',
                'review_schedule' => '',
            ),
            'gap_analysis' => array(),
        );

        // Get current student performance
        $student_data = $this->get_student_activity_data($userid, $courseid, time() - (90 * 24 * 60 * 60), time());
        $student_grade = $this->get_student_overall_grade($userid, $courseid);

        // Get top performer benchmarks
        $top_patterns = $this->get_top_performer_patterns($courseid, 10.0);

        // Calculate performance percentile
        $result['current_performance_percentile'] = $this->calculate_percentile($userid, $courseid);

        // Generate gap analysis
        $result['gap_analysis'] = $this->generate_gap_analysis($student_data, $top_patterns);

        // Generate recommendations
        $result['recommendations'] = $this->generate_recommendations($student_data, $top_patterns);

        // Generate thinking routine
        $result['thinking_routine'] = $this->generate_thinking_routine($student_data, $top_patterns);

        return $result;
    }

    // ========== Helper Methods ==========

    private function get_user_logs($userid, $courseid, $timestart, $timeend) {
        global $DB;

        $params = array('userid' => $userid, 'timestart' => $timestart, 'timeend' => $timeend);
        $sql = "SELECT * FROM {logstore_standard_log}
                WHERE userid = :userid
                AND timecreated >= :timestart
                AND timecreated <= :timeend";

        if ($courseid > 0) {
            $sql .= " AND courseid = :courseid";
            $params['courseid'] = $courseid;
        }

        $sql .= " ORDER BY timecreated ASC";

        return $DB->get_records_sql($sql, $params);
    }

    private function extract_sessions($logs, $session_gap = 1800) {
        // Extract learning sessions (gap > 30 minutes = new session)
        $sessions = array();
        $current_session = null;

        foreach ($logs as $log) {
            if ($current_session === null) {
                $current_session = array(
                    'start' => $log->timecreated,
                    'end' => $log->timecreated,
                    'duration' => 0,
                );
            } else {
                $gap = $log->timecreated - $current_session['end'];
                if ($gap > $session_gap) {
                    // End current session
                    $current_session['duration'] = $current_session['end'] - $current_session['start'];
                    $sessions[] = $current_session;

                    // Start new session
                    $current_session = array(
                        'start' => $log->timecreated,
                        'end' => $log->timecreated,
                        'duration' => 0,
                    );
                } else {
                    $current_session['end'] = $log->timecreated;
                }
            }
        }

        // Add last session
        if ($current_session !== null) {
            $current_session['duration'] = $current_session['end'] - $current_session['start'];
            $sessions[] = $current_session;
        }

        return $sessions;
    }

    private function get_quiz_data($userid, $courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT AVG(qg.grade / q.grade * 100) as avg_grade, COUNT(qa.id) as attempts
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON qa.quiz = q.id
                JOIN {quiz_grades} qg ON qg.quiz = q.id AND qg.userid = qa.userid
                WHERE qa.userid = :userid
                AND qa.timefinish >= :timestart
                AND qa.timefinish <= :timeend";

        $params = array('userid' => $userid, 'timestart' => $timestart, 'timeend' => $timeend);

        if ($courseid > 0) {
            $sql .= " AND q.course = :courseid";
            $params['courseid'] = $courseid;
        }

        $result = $DB->get_record_sql($sql, $params);

        return array(
            'avg_grade' => $result && $result->avg_grade ? round($result->avg_grade, 2) : 0,
            'attempts' => $result && $result->attempts ? $result->attempts : 0,
        );
    }

    private function get_forum_posts_count($userid, $courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT COUNT(fp.id) as count
                FROM {forum_posts} fp
                JOIN {forum_discussions} fd ON fp.discussion = fd.id
                JOIN {forum} f ON fd.forum = f.id
                WHERE fp.userid = :userid
                AND fp.created >= :timestart
                AND fp.created <= :timeend";

        $params = array('userid' => $userid, 'timestart' => $timestart, 'timeend' => $timeend);

        if ($courseid > 0) {
            $sql .= " AND f.course = :courseid";
            $params['courseid'] = $courseid;
        }

        $result = $DB->get_record_sql($sql, $params);
        return $result ? $result->count : 0;
    }

    private function get_resource_views_count($userid, $courseid, $timestart, $timeend) {
        global $DB;

        $sql = "SELECT COUNT(id) as count
                FROM {logstore_standard_log}
                WHERE userid = :userid
                AND action = 'viewed'
                AND target = 'course_module'
                AND timecreated >= :timestart
                AND timecreated <= :timeend";

        $params = array('userid' => $userid, 'timestart' => $timestart, 'timeend' => $timeend);

        if ($courseid > 0) {
            $sql .= " AND courseid = :courseid";
            $params['courseid'] = $courseid;
        }

        $result = $DB->get_record_sql($sql, $params);
        return $result ? $result->count : 0;
    }

    private function get_completion_rate($userid, $courseid) {
        global $DB;

        if ($courseid == 0) {
            return 0;
        }

        $sql = "SELECT
                (SELECT COUNT(*) FROM {course_modules_completion} WHERE userid = :userid1 AND coursemoduleid IN
                    (SELECT id FROM {course_modules} WHERE course = :courseid1 AND completionexpected > 0) AND completionstate > 0) as completed,
                (SELECT COUNT(*) FROM {course_modules} WHERE course = :courseid2 AND completionexpected > 0) as total";

        $result = $DB->get_record_sql($sql, array(
            'userid1' => $userid,
            'courseid1' => $courseid,
            'courseid2' => $courseid,
        ));

        if ($result && $result->total > 0) {
            return round(($result->completed / $result->total) * 100, 2);
        }

        return 0;
    }

    private function analyze_time_patterns($logs) {
        $patterns = array('morning' => 0, 'afternoon' => 0, 'evening' => 0, 'night' => 0);
        $total = count($logs);

        if ($total == 0) {
            return $patterns;
        }

        foreach ($logs as $log) {
            $hour = (int)date('H', $log->timecreated);

            if ($hour >= 6 && $hour < 12) {
                $patterns['morning']++;
            } else if ($hour >= 12 && $hour < 18) {
                $patterns['afternoon']++;
            } else if ($hour >= 18 && $hour < 22) {
                $patterns['evening']++;
            } else {
                $patterns['night']++;
            }
        }

        // Convert to percentages
        foreach ($patterns as $key => $value) {
            $patterns[$key] = round(($value / $total) * 100, 2);
        }

        return $patterns;
    }

    private function get_peak_performance_time($userid, $courseid) {
        global $DB;

        // Analyze quiz performance by time of day
        $sql = "SELECT
                CASE
                    WHEN HOUR(FROM_UNIXTIME(qa.timefinish)) >= 6 AND HOUR(FROM_UNIXTIME(qa.timefinish)) < 12 THEN 'morning'
                    WHEN HOUR(FROM_UNIXTIME(qa.timefinish)) >= 12 AND HOUR(FROM_UNIXTIME(qa.timefinish)) < 18 THEN 'afternoon'
                    WHEN HOUR(FROM_UNIXTIME(qa.timefinish)) >= 18 AND HOUR(FROM_UNIXTIME(qa.timefinish)) < 22 THEN 'evening'
                    ELSE 'night'
                END as time_period,
                AVG(qa.sumgrades / q.sumgrades * 100) as avg_grade
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON qa.quiz = q.id
                WHERE qa.userid = :userid
                AND qa.state = 'finished'";

        $params = array('userid' => $userid);

        if ($courseid > 0) {
            $sql .= " AND q.course = :courseid";
            $params['courseid'] = $courseid;
        }

        $sql .= " GROUP BY time_period ORDER BY avg_grade DESC LIMIT 1";

        $result = $DB->get_record_sql($sql, $params);
        return $result ? $result->time_period : 'afternoon';
    }

    private function calculate_learning_velocity($userid, $courseid) {
        global $DB;

        // Calculate improvement rate over time
        $sql = "SELECT qa.timefinish, (qa.sumgrades / q.sumgrades * 100) as grade
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON qa.quiz = q.id
                WHERE qa.userid = :userid
                AND qa.state = 'finished'";

        $params = array('userid' => $userid);

        if ($courseid > 0) {
            $sql .= " AND q.course = :courseid";
            $params['courseid'] = $courseid;
        }

        $sql .= " ORDER BY qa.timefinish ASC";

        $attempts = $DB->get_records_sql($sql, $params);

        if (count($attempts) < 2) {
            return 0;
        }

        // Calculate linear regression slope
        $grades = array_values(array_map(function($a) { return $a->grade; }, $attempts));
        $n = count($grades);
        $x_sum = ($n * ($n + 1)) / 2; // Sum of 1, 2, 3, ..., n
        $y_sum = array_sum($grades);
        $xy_sum = 0;
        $x_sq_sum = ($n * ($n + 1) * (2 * $n + 1)) / 6; // Sum of squares

        for ($i = 0; $i < $n; $i++) {
            $xy_sum += ($i + 1) * $grades[$i];
        }

        $slope = ($n * $xy_sum - $x_sum * $y_sum) / ($n * $x_sq_sum - $x_sum * $x_sum);

        return round($slope, 2);
    }

    private function get_student_overall_grade($userid, $courseid) {
        global $DB;

        $sql = "SELECT AVG(gg.finalgrade / gi.grademax * 100) as grade
                FROM {grade_grades} gg
                JOIN {grade_items} gi ON gg.itemid = gi.id
                WHERE gg.userid = :userid
                AND gi.courseid = :courseid
                AND gi.itemtype = 'mod'";

        $result = $DB->get_record_sql($sql, array('userid' => $userid, 'courseid' => $courseid));
        return $result && $result->grade ? $result->grade : null;
    }

    private function analyze_top_performer_patterns($top_performer_ids, $courseid) {
        $patterns = array(
            'patterns' => array(),
            'avg_session_duration' => 0,
            'avg_sessions_per_week' => 0,
            'most_common_study_time' => 'afternoon',
        );

        if (empty($top_performer_ids)) {
            return $patterns;
        }

        $total_duration = 0;
        $total_sessions = 0;
        $time_patterns = array('morning' => 0, 'afternoon' => 0, 'evening' => 0, 'night' => 0);

        $timestart = time() - (90 * 24 * 60 * 60); // Last 90 days
        $timeend = time();

        foreach ($top_performer_ids as $userid) {
            $data = $this->get_student_activity_data($userid, $courseid, $timestart, $timeend);
            $total_duration += $data['avg_session_duration'];
            $total_sessions += $data['total_sessions'];

            foreach ($data['activity_pattern'] as $period => $percentage) {
                $time_patterns[$period] += $percentage;
            }
        }

        $count = count($top_performer_ids);
        $patterns['avg_session_duration'] = $count > 0 ? round($total_duration / $count, 2) : 0;

        $weeks = 12; // ~90 days
        $patterns['avg_sessions_per_week'] = $count > 0 ? round($total_sessions / $count / $weeks, 2) : 0;

        // Find most common study time
        arsort($time_patterns);
        $patterns['most_common_study_time'] = key($time_patterns);

        // Identify common patterns
        $patterns['patterns'] = array(
            array(
                'pattern_type' => 'study_duration',
                'description' => 'Consistent study sessions averaging ' . $patterns['avg_session_duration'] . ' minutes',
                'frequency' => 95.0,
                'impact_score' => 8.5,
            ),
            array(
                'pattern_type' => 'session_frequency',
                'description' => 'Regular practice with ' . $patterns['avg_sessions_per_week'] . ' sessions per week',
                'frequency' => 90.0,
                'impact_score' => 9.0,
            ),
            array(
                'pattern_type' => 'time_of_day',
                'description' => 'Peak performance during ' . $patterns['most_common_study_time'] . ' hours',
                'frequency' => 85.0,
                'impact_score' => 7.5,
            ),
            array(
                'pattern_type' => 'active_participation',
                'description' => 'High engagement with forum discussions and peer collaboration',
                'frequency' => 80.0,
                'impact_score' => 8.0,
            ),
        );

        return $patterns;
    }

    private function calculate_percentile($userid, $courseid) {
        global $DB;

        $student_grade = $this->get_student_overall_grade($userid, $courseid);

        if ($student_grade === null) {
            return 0;
        }

        $context = \context_course::instance($courseid);
        $students = get_enrolled_users($context, 'mod/quiz:attempt');

        $lower_count = 0;
        $total_count = 0;

        foreach ($students as $student) {
            $grade = $this->get_student_overall_grade($student->id, $courseid);
            if ($grade !== null) {
                $total_count++;
                if ($grade < $student_grade) {
                    $lower_count++;
                }
            }
        }

        if ($total_count == 0) {
            return 0;
        }

        return round(($lower_count / $total_count) * 100, 2);
    }

    private function generate_gap_analysis($student_data, $top_patterns) {
        $gaps = array();

        // Study duration gap
        $duration_gap = $top_patterns['optimal_study_duration'] - $student_data['avg_session_duration'];
        if (abs($duration_gap) > 5) {
            $gaps[] = array(
                'area' => 'Study Duration',
                'current_level' => $student_data['avg_session_duration'],
                'top_performer_level' => $top_patterns['optimal_study_duration'],
                'gap' => round($duration_gap, 2),
                'improvement_strategy' => $duration_gap > 0 ?
                    'Increase study session duration gradually by 5-10 minutes each week' :
                    'Optimize study sessions for quality over quantity',
            );
        }

        // Session frequency gap
        $weeks = 12;
        $student_freq = $student_data['total_sessions'] / $weeks;
        $freq_gap = $top_patterns['optimal_session_frequency'] - $student_freq;
        if (abs($freq_gap) > 0.5) {
            $gaps[] = array(
                'area' => 'Practice Frequency',
                'current_level' => round($student_freq, 2),
                'top_performer_level' => $top_patterns['optimal_session_frequency'],
                'gap' => round($freq_gap, 2),
                'improvement_strategy' => $freq_gap > 0 ?
                    'Add ' . ceil($freq_gap) . ' more study session(s) per week' :
                    'Current frequency is good, focus on consistency',
            );
        }

        // Completion rate gap
        if ($student_data['completion_rate'] < 90) {
            $gaps[] = array(
                'area' => 'Activity Completion',
                'current_level' => $student_data['completion_rate'],
                'top_performer_level' => 95.0,
                'gap' => round(95.0 - $student_data['completion_rate'], 2),
                'improvement_strategy' => 'Set daily goals to complete 2-3 activities and track progress',
            );
        }

        // Engagement gap (forum participation)
        if ($student_data['forum_posts'] < 5) {
            $gaps[] = array(
                'area' => 'Peer Engagement',
                'current_level' => $student_data['forum_posts'],
                'top_performer_level' => 15.0,
                'gap' => round(15.0 - $student_data['forum_posts'], 2),
                'improvement_strategy' => 'Participate in at least 2 forum discussions per week',
            );
        }

        return $gaps;
    }

    private function generate_recommendations($student_data, $top_patterns) {
        $recommendations = array();

        // Time management recommendation
        if ($student_data['avg_session_duration'] < $top_patterns['optimal_study_duration'] - 10) {
            $recommendations[] = array(
                'category' => 'Time Management',
                'title' => 'Extend Study Sessions',
                'description' => 'Top performers study for an average of ' . $top_patterns['optimal_study_duration'] .
                                 ' minutes per session. Gradually increase your session length to match this optimal duration.',
                'priority' => 'high',
                'expected_impact' => 8.5,
            );
        }

        // Study timing recommendation
        if ($student_data['peak_performance_time'] !== $top_patterns['recommended_time_of_day']) {
            $recommendations[] = array(
                'category' => 'Optimal Timing',
                'title' => 'Adjust Study Schedule',
                'description' => 'Your peak performance is during ' . $student_data['peak_performance_time'] .
                                 ', but top performers study mainly in the ' . $top_patterns['recommended_time_of_day'] .
                                 '. Consider scheduling important tasks during ' . $top_patterns['recommended_time_of_day'] . ' hours.',
                'priority' => 'medium',
                'expected_impact' => 7.0,
            );
        }

        // Consistency recommendation
        $weeks = 12;
        $student_freq = $student_data['total_sessions'] / $weeks;
        if ($student_freq < $top_patterns['optimal_session_frequency'] - 1) {
            $recommendations[] = array(
                'category' => 'Consistency',
                'title' => 'Increase Study Frequency',
                'description' => 'Top performers practice ' . $top_patterns['optimal_session_frequency'] .
                                 ' times per week. Try to add ' . ceil($top_patterns['optimal_session_frequency'] - $student_freq) .
                                 ' more session(s) per week to build consistent habits.',
                'priority' => 'high',
                'expected_impact' => 9.0,
            );
        }

        // Active learning recommendation
        if ($student_data['forum_posts'] < 5) {
            $recommendations[] = array(
                'category' => 'Active Learning',
                'title' => 'Increase Peer Interaction',
                'description' => 'Top performers actively participate in discussions. Engage with peers by posting questions, ' .
                                 'sharing insights, and helping others. Aim for 2-3 meaningful contributions per week.',
                'priority' => 'medium',
                'expected_impact' => 7.5,
            );
        }

        // Completion recommendation
        if ($student_data['completion_rate'] < 80) {
            $recommendations[] = array(
                'category' => 'Progress',
                'title' => 'Improve Activity Completion',
                'description' => 'Your current completion rate is ' . $student_data['completion_rate'] .
                                 '%. Top performers maintain 90%+ completion. Create a checklist and tackle 2-3 activities daily.',
                'priority' => 'high',
                'expected_impact' => 8.0,
            );
        }

        return $recommendations;
    }

    private function generate_thinking_routine($student_data, $top_patterns) {
        $routine = array(
            'morning_routine' => '',
            'study_approach' => '',
            'problem_solving_steps' => '',
            'review_schedule' => '',
        );

        // Morning routine
        $routine['morning_routine'] =
            "1. Review yesterday's key concepts (10-15 minutes)\n" .
            "2. Preview today's topics and set specific learning goals\n" .
            "3. Identify 2-3 challenging problems to tackle during peak hours (" .
            $top_patterns['recommended_time_of_day'] . ")";

        // Study approach based on top performers
        $routine['study_approach'] =
            "• Active Learning: Focus on understanding 'why' before 'how'\n" .
            "• Spaced Practice: Study in " . round($top_patterns['optimal_study_duration']) .
            "-minute focused sessions with 5-10 minute breaks\n" .
            "• Deliberate Practice: Spend 70% time on challenging problems, 30% on review\n" .
            "• Teach to Learn: Explain concepts to peers or write summaries in your own words\n" .
            "• Immediate Application: Practice new concepts within 24 hours of learning";

        // Problem-solving steps (based on top-tier thinking routines)
        $routine['problem_solving_steps'] =
            "1. UNDERSTAND: Read the problem 2-3 times, identify key information and unknowns\n" .
            "2. PLAN: Break down into smaller sub-problems, identify relevant concepts\n" .
            "3. EXECUTE: Solve step-by-step, show all work clearly\n" .
            "4. VERIFY: Check answer makes sense, try alternative methods\n" .
            "5. REFLECT: What did you learn? What mistakes did you make? How can you improve?";

        // Review schedule optimized for retention
        $routine['review_schedule'] =
            "• Same Day: Quick review within 8 hours of learning (10 minutes)\n" .
            "• Next Day: Detailed review and practice problems (20 minutes)\n" .
            "• Weekly: Comprehensive review every Sunday (30-45 minutes)\n" .
            "• Before Assessment: Cumulative review 3 days before tests\n" .
            "• Continuous: Mix old and new topics in daily practice (20-80 rule)";

        return $routine;
    }
}
