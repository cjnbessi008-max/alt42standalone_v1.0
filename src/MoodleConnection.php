<?php
/**
 * Moodle 데이터베이스 연결 관리 클래스
 *
 * MySQL 5.7과 호환되는 PDO 기반 데이터베이스 연결 관리
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

namespace Alt42Standalone;

use PDO;
use PDOException;
use Exception;

class MoodleConnection
{
    /**
     * @var PDO|null 데이터베이스 연결 인스턴스
     */
    private static $instance = null;

    /**
     * @var PDO PDO 객체
     */
    private $pdo;

    /**
     * @var array 설정 배열
     */
    private $config;

    /**
     * @var string 테이블 접두사
     */
    private $tablePrefix;

    /**
     * MoodleConnection 생성자
     *
     * @param array|null $config 설정 배열 (null인 경우 moodle_config.php에서 로드)
     * @throws Exception 연결 실패 시
     */
    private function __construct($config = null)
    {
        $this->config = $config ?: require dirname(__DIR__) . '/config/moodle_config.php';
        $this->tablePrefix = $this->config['database']['prefix'];
        $this->connect();
    }

    /**
     * 싱글톤 인스턴스 반환
     *
     * @param array|null $config 설정 배열
     * @return MoodleConnection
     */
    public static function getInstance($config = null)
    {
        if (self::$instance === null) {
            self::$instance = new self($config);
        }
        return self::$instance;
    }

    /**
     * 데이터베이스 연결
     *
     * @throws Exception 연결 실패 시
     */
    private function connect()
    {
        $dbConfig = $this->config['database'];

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $dbConfig['host'],
            $dbConfig['port'],
            $dbConfig['name'],
            $dbConfig['charset']
        );

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$dbConfig['charset']} COLLATE {$dbConfig['collation']}"
        ];

        try {
            $this->pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $options);

            if ($this->config['debug']['enabled']) {
                $this->log('데이터베이스 연결 성공', 'INFO');
            }
        } catch (PDOException $e) {
            $this->log('데이터베이스 연결 실패: ' . $e->getMessage(), 'ERROR');
            throw new Exception('Moodle 데이터베이스 연결 실패: ' . $e->getMessage());
        }
    }

    /**
     * PDO 객체 반환
     *
     * @return PDO
     */
    public function getPdo()
    {
        return $this->pdo;
    }

    /**
     * 테이블 이름에 접두사 추가
     *
     * @param string $tableName 테이블 이름
     * @return string 접두사가 추가된 테이블 이름
     */
    public function table($tableName)
    {
        return $this->tablePrefix . $tableName;
    }

    /**
     * SELECT 쿼리 실행
     *
     * @param string $sql SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return array 결과 배열
     */
    public function select($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->log('SELECT 쿼리 실패: ' . $e->getMessage(), 'ERROR');
            throw new Exception('SELECT 쿼리 실패: ' . $e->getMessage());
        }
    }

    /**
     * SELECT 쿼리 실행 (단일 행)
     *
     * @param string $sql SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return array|false 결과 배열 또는 false
     */
    public function selectOne($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->log('SELECT ONE 쿼리 실패: ' . $e->getMessage(), 'ERROR');
            throw new Exception('SELECT ONE 쿼리 실패: ' . $e->getMessage());
        }
    }

    /**
     * INSERT 쿼리 실행
     *
     * @param string $sql SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return string 삽입된 행의 ID
     */
    public function insert($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            $this->log('INSERT 쿼리 실패: ' . $e->getMessage(), 'ERROR');
            throw new Exception('INSERT 쿼리 실패: ' . $e->getMessage());
        }
    }

    /**
     * UPDATE 쿼리 실행
     *
     * @param string $sql SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return int 영향받은 행 수
     */
    public function update($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->log('UPDATE 쿼리 실패: ' . $e->getMessage(), 'ERROR');
            throw new Exception('UPDATE 쿼리 실패: ' . $e->getMessage());
        }
    }

    /**
     * DELETE 쿼리 실행
     *
     * @param string $sql SQL 쿼리
     * @param array $params 바인딩 파라미터
     * @return int 삭제된 행 수
     */
    public function delete($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->log('DELETE 쿼리 실패: ' . $e->getMessage(), 'ERROR');
            throw new Exception('DELETE 쿼리 실패: ' . $e->getMessage());
        }
    }

    /**
     * 트랜잭션 시작
     *
     * @return bool
     */
    public function beginTransaction()
    {
        return $this->pdo->beginTransaction();
    }

    /**
     * 트랜잭션 커밋
     *
     * @return bool
     */
    public function commit()
    {
        return $this->pdo->commit();
    }

    /**
     * 트랜잭션 롤백
     *
     * @return bool
     */
    public function rollback()
    {
        return $this->pdo->rollBack();
    }

    /**
     * 연결 종료
     */
    public function close()
    {
        $this->pdo = null;
    }

    /**
     * 연결 상태 확인
     *
     * @return bool
     */
    public function isConnected()
    {
        try {
            return $this->pdo !== null && $this->pdo->query('SELECT 1') !== false;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * 로그 기록
     *
     * @param string $message 로그 메시지
     * @param string $level 로그 레벨 (DEBUG, INFO, WARNING, ERROR)
     */
    private function log($message, $level = 'INFO')
    {
        if (!$this->config['debug']['enabled']) {
            return;
        }

        $logLevels = ['DEBUG' => 0, 'INFO' => 1, 'WARNING' => 2, 'ERROR' => 3];
        $currentLevel = $logLevels[$this->config['debug']['log_level']] ?? 1;
        $messageLevel = $logLevels[$level] ?? 1;

        if ($messageLevel >= $currentLevel) {
            $timestamp = date('Y-m-d H:i:s');
            $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
            error_log($logMessage);
        }
    }

    /**
     * 복제 방지
     */
    private function __clone()
    {
    }

    /**
     * 직렬화 방지
     */
    public function __sleep()
    {
        throw new Exception('Cannot serialize singleton');
    }

    /**
     * 역직렬화 방지
     */
    public function __wakeup()
    {
        throw new Exception('Cannot unserialize singleton');
    }
}
