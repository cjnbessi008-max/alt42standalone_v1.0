<?php
/**
 * Database Configuration
 * MySQL 5.7 연결 설정
 */

// 데이터베이스 설정
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'stat_story_mode');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

/**
 * 데이터베이스 연결 함수
 * @return PDO|null
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            return null;
        }
    }

    return $pdo;
}

/**
 * 데이터베이스 연결 테스트
 * @return bool
 */
function testDBConnection() {
    $pdo = getDBConnection();
    if ($pdo === null) {
        return false;
    }

    try {
        $stmt = $pdo->query("SELECT 1");
        return $stmt !== false;
    } catch (PDOException $e) {
        error_log("Database Test Error: " . $e->getMessage());
        return false;
    }
}

/**
 * 트랜잭션 시작
 */
function beginTransaction() {
    $pdo = getDBConnection();
    if ($pdo) {
        $pdo->beginTransaction();
    }
}

/**
 * 트랜잭션 커밋
 */
function commitTransaction() {
    $pdo = getDBConnection();
    if ($pdo && $pdo->inTransaction()) {
        $pdo->commit();
    }
}

/**
 * 트랜잭션 롤백
 */
function rollbackTransaction() {
    $pdo = getDBConnection();
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
}

/**
 * Prepared Statement 실행
 * @param string $query SQL 쿼리
 * @param array $params 파라미터 배열
 * @return PDOStatement|false
 */
function executeQuery($query, $params = []) {
    $pdo = getDBConnection();
    if ($pdo === null) {
        return false;
    }

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        error_log("Query Execution Error: " . $e->getMessage());
        error_log("Query: " . $query);
        return false;
    }
}

/**
 * SELECT 쿼리 실행 및 결과 반환
 * @param string $query SQL 쿼리
 * @param array $params 파라미터 배열
 * @return array 결과 배열
 */
function fetchAll($query, $params = []) {
    $stmt = executeQuery($query, $params);
    if ($stmt === false) {
        return [];
    }
    return $stmt->fetchAll();
}

/**
 * SELECT 쿼리 실행 및 단일 결과 반환
 * @param string $query SQL 쿼리
 * @param array $params 파라미터 배열
 * @return array|null 결과 배열 또는 null
 */
function fetchOne($query, $params = []) {
    $stmt = executeQuery($query, $params);
    if ($stmt === false) {
        return null;
    }
    $result = $stmt->fetch();
    return $result !== false ? $result : null;
}

/**
 * INSERT 쿼리 실행 및 마지막 삽입 ID 반환
 * @param string $query SQL 쿼리
 * @param array $params 파라미터 배열
 * @return int|false 마지막 삽입 ID 또는 false
 */
function insertAndGetId($query, $params = []) {
    $pdo = getDBConnection();
    if ($pdo === null) {
        return false;
    }

    $stmt = executeQuery($query, $params);
    if ($stmt === false) {
        return false;
    }

    return (int)$pdo->lastInsertId();
}
