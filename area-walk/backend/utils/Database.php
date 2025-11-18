<?php
/**
 * Database Connection Utility
 * PDO를 사용한 MySQL 데이터베이스 연결 관리
 */

class Database {
    private static $instance = null;
    private $connection;
    private $host;
    private $dbName;
    private $username;
    private $password;
    private $charset;

    /**
     * 생성자 - Singleton 패턴
     */
    private function __construct() {
        $this->host = DB_HOST;
        $this->dbName = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->charset = DB_CHARSET;

        $this->connect();
    }

    /**
     * 싱글톤 인스턴스 가져오기
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 데이터베이스 연결
     */
    private function connect() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->dbName};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
            ];

            $this->connection = new PDO($dsn, $this->username, $this->password, $options);

            if (APP_DEBUG) {
                error_log('[Database] Connected successfully');
            }
        } catch (PDOException $e) {
            $this->handleError('Connection failed', $e);
        }
    }

    /**
     * PDO 연결 객체 반환
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * SELECT 쿼리 실행
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->handleError('Query failed', $e, $sql);
            return false;
        }
    }

    /**
     * SELECT - 단일 행 반환
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetch() : null;
    }

    /**
     * SELECT - 모든 행 반환
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }

    /**
     * INSERT 쿼리 실행
     */
    public function insert($table, $data) {
        $fields = array_keys($data);
        $values = array_values($data);
        $placeholders = array_fill(0, count($fields), '?');

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $fields),
            implode(', ', $placeholders)
        );

        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($values);
            return $this->connection->lastInsertId();
        } catch (PDOException $e) {
            $this->handleError('Insert failed', $e, $sql);
            return false;
        }
    }

    /**
     * UPDATE 쿼리 실행
     */
    public function update($table, $data, $where, $whereParams = []) {
        $fields = [];
        foreach (array_keys($data) as $field) {
            $fields[] = "$field = ?";
        }

        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s',
            $table,
            implode(', ', $fields),
            $where
        );

        $values = array_merge(array_values($data), $whereParams);

        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($values);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->handleError('Update failed', $e, $sql);
            return false;
        }
    }

    /**
     * DELETE 쿼리 실행
     */
    public function delete($table, $where, $whereParams = []) {
        $sql = sprintf('DELETE FROM %s WHERE %s', $table, $where);

        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($whereParams);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->handleError('Delete failed', $e, $sql);
            return false;
        }
    }

    /**
     * 트랜잭션 시작
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * 트랜잭션 커밋
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * 트랜잭션 롤백
     */
    public function rollback() {
        return $this->connection->rollBack();
    }

    /**
     * 마지막 삽입 ID 반환
     */
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }

    /**
     * 에러 핸들링
     */
    private function handleError($message, $exception, $sql = '') {
        $errorMessage = sprintf(
            '[Database Error] %s: %s',
            $message,
            $exception->getMessage()
        );

        if ($sql && APP_DEBUG) {
            $errorMessage .= " | SQL: $sql";
        }

        error_log($errorMessage);

        if (APP_DEBUG) {
            throw new Exception($errorMessage);
        }
    }

    /**
     * 연결 종료 방지 (Singleton)
     */
    private function __clone() {}
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
