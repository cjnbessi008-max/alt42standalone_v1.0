<?php
/**
 * Database Connection Manager
 * 데이터베이스 연결 관리자
 */

namespace OverconfidenceDetector\Utils;

use PDO;
use PDOException;

class Database
{
    private static $instances = [];
    private $connection;
    private $config;

    /**
     * 생성자 (private - Singleton 패턴)
     */
    private function __construct(array $config)
    {
        $this->config = $config;
        $this->connect();
    }

    /**
     * 데이터베이스 인스턴스 가져오기
     *
     * @param string $name 데이터베이스 이름 ('main' 또는 'moodle')
     * @return Database
     */
    public static function getInstance($name = 'main')
    {
        if (!isset(self::$instances[$name])) {
            $config = require __DIR__ . '/../../config/database.php';

            if (!isset($config[$name])) {
                throw new \Exception("Database configuration for '{$name}' not found");
            }

            self::$instances[$name] = new self($config[$name]);
        }

        return self::$instances[$name];
    }

    /**
     * 데이터베이스 연결
     */
    private function connect()
    {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $this->config['host'],
                $this->config['port'],
                $this->config['database'],
                $this->config['charset']
            );

            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $this->config['options']
            );
        } catch (PDOException $e) {
            throw new \Exception("Database connection failed: " . $e->getMessage());
        }
    }

    /**
     * PDO 연결 객체 가져오기
     *
     * @return PDO
     */
    public function getConnection()
    {
        return $this->connection;
    }

    /**
     * SELECT 쿼리 실행
     *
     * @param string $query SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return array 결과 배열
     */
    public function select($query, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError($query, $params, $e);
            throw $e;
        }
    }

    /**
     * SELECT 쿼리 실행 (단일 행)
     *
     * @param string $query SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return array|null 결과 행
     */
    public function selectOne($query, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            $this->logError($query, $params, $e);
            throw $e;
        }
    }

    /**
     * INSERT 쿼리 실행
     *
     * @param string $query SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return int 삽입된 행의 ID
     */
    public function insert($query, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            return (int) $this->connection->lastInsertId();
        } catch (PDOException $e) {
            $this->logError($query, $params, $e);
            throw $e;
        }
    }

    /**
     * UPDATE 쿼리 실행
     *
     * @param string $query SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return int 영향받은 행 수
     */
    public function update($query, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError($query, $params, $e);
            throw $e;
        }
    }

    /**
     * DELETE 쿼리 실행
     *
     * @param string $query SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return int 삭제된 행 수
     */
    public function delete($query, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError($query, $params, $e);
            throw $e;
        }
    }

    /**
     * 트랜잭션 시작
     */
    public function beginTransaction()
    {
        $this->connection->beginTransaction();
    }

    /**
     * 트랜잭션 커밋
     */
    public function commit()
    {
        $this->connection->commit();
    }

    /**
     * 트랜잭션 롤백
     */
    public function rollback()
    {
        $this->connection->rollback();
    }

    /**
     * 테이블에 데이터 삽입 (배열 형식)
     *
     * @param string $table 테이블 이름
     * @param array $data 컬럼 => 값 배열
     * @return int 삽입된 행의 ID
     */
    public function insertArray($table, array $data)
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $query = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";

        return $this->insert($query, array_values($data));
    }

    /**
     * 테이블 데이터 업데이트 (배열 형식)
     *
     * @param string $table 테이블 이름
     * @param array $data 컬럼 => 값 배열
     * @param array $where WHERE 조건 배열
     * @return int 영향받은 행 수
     */
    public function updateArray($table, array $data, array $where)
    {
        $setClause = implode(', ', array_map(function ($col) {
            return "{$col} = ?";
        }, array_keys($data)));

        $whereClause = implode(' AND ', array_map(function ($col) {
            return "{$col} = ?";
        }, array_keys($where)));

        $query = "UPDATE {$table} SET {$setClause} WHERE {$whereClause}";
        $params = array_merge(array_values($data), array_values($where));

        return $this->update($query, $params);
    }

    /**
     * 에러 로깅
     *
     * @param string $query SQL 쿼리
     * @param array $params 파라미터
     * @param PDOException $exception 예외
     */
    private function logError($query, array $params, PDOException $exception)
    {
        $message = sprintf(
            "[DB Error] %s\nQuery: %s\nParams: %s\n",
            $exception->getMessage(),
            $query,
            json_encode($params)
        );

        Logger::error($message);
    }

    /**
     * 연결 종료 방지 (Singleton)
     */
    private function __clone()
    {
    }

    /**
     * 직렬화 방지 (Singleton)
     */
    public function __wakeup()
    {
        throw new \Exception("Cannot unserialize singleton");
    }
}
