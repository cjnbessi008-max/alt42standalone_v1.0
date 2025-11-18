<?php
/**
 * Truth Rhythm - Database Connection Test
 */

require_once 'config.php';

setCorsHeaders();

try {
    $pdo = getDbConnection();

    // 테이블 존재 확인
    $tables = ['users', 'questions', 'learning_sessions', 'answer_records', 'user_progress'];
    $existingTables = [];
    $missingTables = [];

    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($stmt->rowCount() > 0) {
            $existingTables[] = $table;
        } else {
            $missingTables[] = $table;
        }
    }

    // 샘플 데이터 확인
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM questions");
    $questionCount = $stmt->fetch()['count'];

    successResponse([
        'status' => 'connected',
        'message' => 'Database connection successful',
        'database' => DB_NAME,
        'tables' => [
            'existing' => $existingTables,
            'missing' => $missingTables
        ],
        'sample_data' => [
            'questions' => $questionCount
        ],
        'ready' => count($missingTables) === 0 && $questionCount > 0
    ]);

} catch (Exception $e) {
    errorResponse('Database connection failed: ' . $e->getMessage(), 500);
}
