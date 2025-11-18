<?php
/**
 * Door State API Endpoints
 */

function handleDoorStateAPI($method, $path_parts, $data) {
    $doorState = new DoorState();
    $rule = new Rule();

    // GET /door-state/{rule_id}/{student_id} - Get current door state
    if ($method === 'GET' && count($path_parts) === 3) {
        $rule_id = intval($path_parts[1]);
        $student_id = intval($path_parts[2]);

        $state = $doorState->getCurrentState($rule_id, $student_id);

        if ($state) {
            // Decode metadata JSON
            if (isset($state['metadata'])) {
                $state['metadata'] = json_decode($state['metadata'], true);
            }
            ApiResponse::success($state, 'Door state retrieved successfully');
        } else {
            // Return default state if no state exists
            ApiResponse::success([
                'rule_id' => $rule_id,
                'student_id' => $student_id,
                'door_status' => 'closed',
                'reason' => 'No state recorded yet',
                'metadata' => null
            ], 'Default door state');
        }
    }

    // POST /door-state/evaluate - Evaluate door state based on current answer
    if ($method === 'POST' && count($path_parts) === 2 && $path_parts[1] === 'evaluate') {
        // Validate required fields
        if (!isset($data['rule_id']) || !isset($data['student_id']) || !isset($data['answer_data'])) {
            ApiResponse::error('Missing required fields: rule_id, student_id, answer_data', 400);
        }

        $rule_id = intval($data['rule_id']);
        $student_id = intval($data['student_id']);
        $answer_data = $data['answer_data'];

        // Get rule information
        $rule_data = $rule->getById($rule_id);
        if (!$rule_data) {
            ApiResponse::error('Rule not found', 404);
        }

        // Create rule object with data
        $rule_obj = new Rule();
        $rule_obj->id = $rule_data['id'];
        $rule_obj->rule_type = $rule_data['rule_type'];

        // Evaluate door state
        $doorState->rule_id = $rule_id;
        $doorState->student_id = $student_id;
        $doorState->metadata = [
            'answer_preview' => $answer_data,
            'evaluation_time' => date('Y-m-d H:i:s')
        ];

        $door_status = $doorState->evaluateDoorState($rule_obj, $student_id, $answer_data);

        // Save the state
        if ($doorState->save()) {
            ApiResponse::success([
                'door_status' => $door_status,
                'reason' => $doorState->reason,
                'rule_type' => $rule_data['rule_type'],
                'rule_name' => $rule_data['rule_name']
            ], 'Door state evaluated successfully');
        } else {
            ApiResponse::error('Failed to save door state', 500);
        }
    }

    // POST /door-state/update - Manually update door state
    if ($method === 'POST' && count($path_parts) === 2 && $path_parts[1] === 'update') {
        // Validate required fields
        if (!isset($data['rule_id']) || !isset($data['student_id']) || !isset($data['door_status'])) {
            ApiResponse::error('Missing required fields: rule_id, student_id, door_status', 400);
        }

        // Validate door status
        if (!in_array($data['door_status'], ['open', 'closed'])) {
            ApiResponse::error('Invalid door_status. Must be open or closed', 400);
        }

        $doorState->rule_id = intval($data['rule_id']);
        $doorState->student_id = intval($data['student_id']);
        $doorState->door_status = $data['door_status'];
        $doorState->reason = $data['reason'] ?? 'Manual update';
        $doorState->metadata = $data['metadata'] ?? [];

        if ($doorState->save()) {
            $current_state = $doorState->getCurrentState($doorState->rule_id, $doorState->student_id);
            ApiResponse::success($current_state, 'Door state updated successfully');
        } else {
            ApiResponse::error('Failed to update door state', 500);
        }
    }

    // GET /door-state/student/{student_id} - Get all door states for a student
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'student') {
        $student_id = intval($path_parts[2]);
        $states = $doorState->getStudentDoorStates($student_id);

        // Decode metadata for each state
        foreach ($states as &$state) {
            if (isset($state['metadata'])) {
                $state['metadata'] = json_decode($state['metadata'], true);
            }
        }

        ApiResponse::success($states, 'Student door states retrieved successfully');
    }

    // GET /door-state/{rule_id}/statistics - Get door state statistics
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[2] === 'statistics') {
        $rule_id = intval($path_parts[1]);
        $stats = $doorState->getStatistics($rule_id);

        ApiResponse::success($stats, 'Door state statistics retrieved successfully');
    }

    ApiResponse::error('Invalid endpoint or method', 400);
}
