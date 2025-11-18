<?php
/**
 * Rules API Endpoints
 */

function handleRulesAPI($method, $path_parts, $data) {
    $rule = new Rule();

    // GET /rules - Get all active rules
    if ($method === 'GET' && count($path_parts) === 1) {
        $rules = $rule->getAllActive();
        ApiResponse::success($rules, 'Rules retrieved successfully');
    }

    // GET /rules/{id} - Get rule by ID
    if ($method === 'GET' && count($path_parts) === 2) {
        $rule_id = intval($path_parts[1]);
        $rule_data = $rule->getById($rule_id);

        if ($rule_data) {
            ApiResponse::success($rule_data, 'Rule retrieved successfully');
        } else {
            ApiResponse::error('Rule not found', 404);
        }
    }

    // GET /rules/quiz/{quiz_id} - Get rule by quiz ID
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'quiz') {
        $quiz_id = intval($path_parts[2]);
        $rule_data = $rule->getByQuizId($quiz_id);

        if ($rule_data) {
            ApiResponse::success($rule_data, 'Rule retrieved successfully');
        } else {
            ApiResponse::error('No rule found for this quiz', 404);
        }
    }

    // POST /rules - Create new rule
    if ($method === 'POST' && count($path_parts) === 1) {
        // Validate required fields
        if (!isset($data['moodle_quiz_id']) || !isset($data['moodle_course_id']) ||
            !isset($data['rule_name']) || !isset($data['rule_type'])) {
            ApiResponse::error('Missing required fields', 400);
        }

        // Validate rule type
        if (!in_array($data['rule_type'], ['duplicate_allowed', 'duplicate_not_allowed'])) {
            ApiResponse::error('Invalid rule_type. Must be duplicate_allowed or duplicate_not_allowed', 400);
        }

        $rule->moodle_quiz_id = $data['moodle_quiz_id'];
        $rule->moodle_course_id = $data['moodle_course_id'];
        $rule->rule_name = $data['rule_name'];
        $rule->rule_type = $data['rule_type'];
        $rule->description = $data['description'] ?? '';
        $rule->is_active = isset($data['is_active']) ? intval($data['is_active']) : 1;

        if ($rule->create()) {
            $created_rule = $rule->getById($rule->id);
            ApiResponse::success($created_rule, 'Rule created successfully', 201);
        } else {
            ApiResponse::error('Failed to create rule', 500);
        }
    }

    // PUT /rules/{id} - Update rule
    if ($method === 'PUT' && count($path_parts) === 2) {
        $rule_id = intval($path_parts[1]);

        // Check if rule exists
        $existing_rule = $rule->getById($rule_id);
        if (!$existing_rule) {
            ApiResponse::error('Rule not found', 404);
        }

        // Validate rule type if provided
        if (isset($data['rule_type']) && !in_array($data['rule_type'], ['duplicate_allowed', 'duplicate_not_allowed'])) {
            ApiResponse::error('Invalid rule_type', 400);
        }

        $rule->id = $rule_id;
        $rule->rule_name = $data['rule_name'] ?? $existing_rule['rule_name'];
        $rule->rule_type = $data['rule_type'] ?? $existing_rule['rule_type'];
        $rule->description = $data['description'] ?? $existing_rule['description'];
        $rule->is_active = isset($data['is_active']) ? intval($data['is_active']) : $existing_rule['is_active'];

        if ($rule->update()) {
            $updated_rule = $rule->getById($rule_id);
            ApiResponse::success($updated_rule, 'Rule updated successfully');
        } else {
            ApiResponse::error('Failed to update rule', 500);
        }
    }

    // DELETE /rules/{id} - Delete (soft delete) rule
    if ($method === 'DELETE' && count($path_parts) === 2) {
        $rule_id = intval($path_parts[1]);

        // Check if rule exists
        $existing_rule = $rule->getById($rule_id);
        if (!$existing_rule) {
            ApiResponse::error('Rule not found', 404);
        }

        if ($rule->delete($rule_id)) {
            ApiResponse::success(null, 'Rule deleted successfully');
        } else {
            ApiResponse::error('Failed to delete rule', 500);
        }
    }

    // GET /rules/{id}/statistics - Get rule statistics
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[2] === 'statistics') {
        $rule_id = intval($path_parts[1]);
        $stats = $rule->getStatistics($rule_id);

        if ($stats) {
            ApiResponse::success($stats, 'Statistics retrieved successfully');
        } else {
            ApiResponse::error('Rule not found', 404);
        }
    }

    ApiResponse::error('Invalid endpoint or method', 400);
}
