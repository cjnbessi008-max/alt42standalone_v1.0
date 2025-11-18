<?php
/**
 * Concepts API Endpoint
 * Handles concept-related queries
 */

$db = Database::getInstance();
$detector = new AvoidanceDetector();

switch ($method) {
    case 'GET':
        if ($id) {
            // Get specific concept
            if ($action === 'patterns') {
                // Get avoidance patterns for concept
                $include_resolved = isset($_GET['include_resolved']) && $_GET['include_resolved'] === 'true';
                $patterns = $detector->getConceptPatterns($id, $include_resolved);
                send_success_response($patterns);
            }
            elseif ($action === 'statistics') {
                // Get concept statistics
                $sql = "SELECT
                            COUNT(DISTINCT moodle_user_id) as student_count,
                            AVG(accuracy_rate) as avg_accuracy,
                            AVG(avg_response_time) as avg_time,
                            SUM(total_attempts) as total_attempts
                        FROM student_analysis
                        WHERE concept_id = :concept_id";

                $stats = $db->fetchOne($sql, [':concept_id' => $id]);
                send_success_response($stats);
            }
            else {
                // Get concept details
                $sql = "SELECT * FROM concepts WHERE id = :id";
                $concept = $db->fetchOne($sql, [':id' => $id]);

                if ($concept) {
                    send_success_response($concept);
                } else {
                    send_error_response('Concept not found', 404);
                }
            }
        } else {
            // Get all concepts
            $subject = $_GET['subject'] ?? null;
            $grade = $_GET['grade'] ?? null;

            $sql = "SELECT * FROM concepts WHERE 1=1";
            $params = [];

            if ($subject) {
                $sql .= " AND subject = :subject";
                $params[':subject'] = $subject;
            }

            if ($grade) {
                $sql .= " AND grade_level = :grade";
                $params[':grade'] = $grade;
            }

            $sql .= " ORDER BY difficulty_level, concept_code";

            $concepts = $db->fetchAll($sql, $params);
            send_success_response($concepts);
        }
        break;

    case 'POST':
        // Create new concept
        if (!$input) {
            send_error_response('No input data provided', 400);
        }

        $required = ['concept_code', 'concept_name'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                send_error_response("Missing required field: {$field}", 400);
            }
        }

        $concept_id = $db->insert('concepts', [
            'concept_code' => $input['concept_code'],
            'concept_name' => $input['concept_name'],
            'concept_name_ko' => $input['concept_name_ko'] ?? null,
            'description' => $input['description'] ?? null,
            'parent_concept_id' => $input['parent_concept_id'] ?? null,
            'difficulty_level' => $input['difficulty_level'] ?? 1,
            'subject' => $input['subject'] ?? 'mathematics',
            'grade_level' => $input['grade_level'] ?? null
        ]);

        send_success_response(['id' => $concept_id], 'Concept created successfully');
        break;

    case 'PUT':
        // Update concept
        if (!$id) {
            send_error_response('Concept ID required', 400);
        }

        $update_fields = [];
        $allowed_fields = ['concept_name', 'concept_name_ko', 'description', 'parent_concept_id',
                          'difficulty_level', 'subject', 'grade_level'];

        foreach ($allowed_fields as $field) {
            if (isset($input[$field])) {
                $update_fields[$field] = $input[$field];
            }
        }

        if (empty($update_fields)) {
            send_error_response('No fields to update', 400);
        }

        $rows = $db->update('concepts', $update_fields, 'id = :id', [':id' => $id]);

        if ($rows > 0) {
            send_success_response(null, 'Concept updated successfully');
        } else {
            send_error_response('Concept not found or no changes made', 404);
        }
        break;

    default:
        send_error_response('Method not allowed', 405);
}
