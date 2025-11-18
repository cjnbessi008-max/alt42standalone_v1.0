<?php
/**
 * MySQL 데이터베이스 연결 및 쿼리 관리
 * MySQL 5.7 호환
 */

require_once 'config.php';

class Database {
    private $conn;
    private $host;
    private $port;
    private $dbname;
    private $username;
    private $password;
    private $charset;

    /**
     * 생성자
     */
    public function __construct() {
        $this->host = DB_HOST;
        $this->port = DB_PORT;
        $this->dbname = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->charset = DB_CHARSET;
    }

    /**
     * 데이터베이스 연결
     */
    public function connect() {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbname};charset={$this->charset}";

            $options = array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
            );

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

            debug_log('Database connected successfully');

            return $this->conn;
        } catch (PDOException $e) {
            debug_log('Database connection failed', $e->getMessage());
            error_response('데이터베이스 연결 실패: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 연결 반환
     */
    public function getConnection() {
        if ($this->conn === null) {
            $this->connect();
        }
        return $this->conn;
    }

    /**
     * 쿼리 실행
     */
    public function query($sql, $params = array()) {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            debug_log('Query failed', array('sql' => $sql, 'error' => $e->getMessage()));
            throw $e;
        }
    }

    /**
     * SELECT 쿼리 (단일 행)
     */
    public function fetchOne($sql, $params = array()) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * SELECT 쿼리 (다중 행)
     */
    public function fetchAll($sql, $params = array()) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * INSERT 쿼리
     */
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));

        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";

        $this->query($sql, $data);

        return $this->getConnection()->lastInsertId();
    }

    /**
     * UPDATE 쿼리
     */
    public function update($table, $data, $where, $whereParams = array()) {
        $set = array();
        foreach (array_keys($data) as $column) {
            $set[] = "{$column} = :{$column}";
        }
        $setString = implode(', ', $set);

        $sql = "UPDATE {$table} SET {$setString} WHERE {$where}";

        $params = array_merge($data, $whereParams);

        $this->query($sql, $params);

        return $this->getConnection()->rowCount();
    }

    /**
     * DELETE 쿼리
     */
    public function delete($table, $where, $params = array()) {
        $sql = "DELETE FROM {$table} WHERE {$where}";

        $this->query($sql, $params);

        return $this->getConnection()->rowCount();
    }

    /**
     * 트랜잭션 시작
     */
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }

    /**
     * 트랜잭션 커밋
     */
    public function commit() {
        return $this->getConnection()->commit();
    }

    /**
     * 트랜잭션 롤백
     */
    public function rollback() {
        return $this->getConnection()->rollBack();
    }

    /**
     * 연결 종료
     */
    public function close() {
        $this->conn = null;
    }
}

/**
 * 데이터베이스 인스턴스 가져오기
 */
function getDatabase() {
    static $db = null;
    if ($db === null) {
        $db = new Database();
    }
    return $db;
}

?>
