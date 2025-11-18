<?php
/**
 * 데이터베이스 설정 예시 파일
 *
 * 사용 방법:
 * 1. 이 파일을 database.php로 복사
 * 2. 아래 설정값을 실제 환경에 맞게 수정
 *
 * cp database.example.php database.php
 */

// Moodle 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here'); // 실제 비밀번호로 변경하세요
define('DB_CHARSET', 'utf8mb4');

// 데이터베이스 연결 클래스
class Database {
    private $conn = null;

    /**
     * 데이터베이스 연결 생성
     */
    public function getConnection() {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);

            return $this->conn;
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 연결 종료
     */
    public function closeConnection() {
        $this->conn = null;
    }

    /**
     * 연결 상태 확인
     */
    public function isConnected() {
        return $this->conn !== null;
    }
}

/**
 * 전역 데이터베이스 인스턴스 가져오기
 */
function getDatabase() {
    static $database = null;

    if ($database === null) {
        $database = new Database();
    }

    return $database;
}
?>
