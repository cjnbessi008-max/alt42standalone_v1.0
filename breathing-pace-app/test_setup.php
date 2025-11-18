#!/usr/bin/env php
<?php
/**
 * Setup Test Script
 * 설치 및 설정 확인 스크립트
 */

echo "=================================================\n";
echo "  Breathing Pace Learning Assistant - Setup Test\n";
echo "=================================================\n\n";

$errors = [];
$warnings = [];

// 1. PHP 버전 확인
echo "[1/8] PHP 버전 확인...\n";
$phpVersion = phpversion();
echo "      현재 PHP 버전: $phpVersion\n";

if (version_compare($phpVersion, '7.1.9', '<')) {
    $errors[] = "PHP 7.1.9 이상이 필요합니다. 현재: $phpVersion";
} else {
    echo "      ✓ PHP 버전 OK\n";
}

// 2. PHP 확장 모듈 확인
echo "\n[2/8] PHP 확장 모듈 확인...\n";
$requiredExtensions = ['pdo', 'pdo_mysql', 'curl', 'json', 'mbstring'];

foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "      ✓ $ext\n";
    } else {
        $errors[] = "필수 PHP 확장 모듈 누락: $ext";
    }
}

// 3. 설정 파일 확인
echo "\n[3/8] 설정 파일 확인...\n";
$configFile = __DIR__ . '/src/config/config.php';

if (file_exists($configFile)) {
    echo "      ✓ config.php 존재\n";
    require_once $configFile;
} else {
    $errors[] = "설정 파일을 찾을 수 없습니다: $configFile";
}

// 4. 데이터베이스 연결 확인
echo "\n[4/8] 데이터베이스 연결 확인...\n";

if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "      ✓ 데이터베이스 연결 성공\n";

        // 테이블 확인
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo "      ✓ 테이블 개수: " . count($tables) . "\n";

        $requiredTables = [
            'users',
            'breathing_sessions',
            'questions',
            'user_statistics'
        ];

        foreach ($requiredTables as $table) {
            if (in_array($table, $tables)) {
                echo "      ✓ $table\n";
            } else {
                $errors[] = "필수 테이블 누락: $table";
            }
        }
    } catch (PDOException $e) {
        $errors[] = "데이터베이스 연결 실패: " . $e->getMessage();
    }
} else {
    $errors[] = "데이터베이스 설정이 누락되었습니다.";
}

// 5. 디렉토리 구조 확인
echo "\n[5/8] 디렉토리 구조 확인...\n";
$requiredDirs = [
    'public',
    'src/api',
    'src/config',
    'database',
    'docs'
];

foreach ($requiredDirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    if (is_dir($path)) {
        echo "      ✓ $dir/\n";
    } else {
        $errors[] = "디렉토리 누락: $dir";
    }
}

// 6. 파일 권한 확인
echo "\n[6/8] 파일 권한 확인...\n";
$criticalFiles = [
    'src/config/config.php',
    'public/index.html',
    'src/api/moodle.php'
];

foreach ($criticalFiles as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        if (is_readable($path)) {
            echo "      ✓ $file (읽기 가능)\n";
        } else {
            $warnings[] = "파일을 읽을 수 없습니다: $file";
        }
    } else {
        $errors[] = "파일 누락: $file";
    }
}

// 7. 웹 서버 확인
echo "\n[7/8] 웹 서버 확인...\n";
if (isset($_SERVER['SERVER_SOFTWARE'])) {
    echo "      웹 서버: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
} else {
    echo "      ⚠ CLI 모드로 실행 중 (웹 서버 정보 없음)\n";
}

// 8. Moodle 연결 테스트 (선택사항)
echo "\n[8/8] Moodle 설정 확인...\n";
if (defined('MOODLE_URL') && !empty(MOODLE_URL)) {
    echo "      Moodle URL: " . MOODLE_URL . "\n";
    if (defined('MOODLE_TOKEN') && !empty(MOODLE_TOKEN)) {
        echo "      ✓ API 토큰 설정됨\n";
    } else {
        $warnings[] = "Moodle API 토큰이 설정되지 않았습니다 (UI에서 설정 가능)";
    }
} else {
    echo "      ⚠ Moodle 설정이 없습니다 (UI에서 설정 가능)\n";
}

// 결과 출력
echo "\n=================================================\n";
echo "  테스트 결과\n";
echo "=================================================\n";

if (count($errors) === 0 && count($warnings) === 0) {
    echo "\n✓ 모든 테스트 통과!\n";
    echo "애플리케이션을 사용할 준비가 되었습니다.\n\n";
    echo "다음 단계:\n";
    echo "1. 웹 브라우저에서 애플리케이션 접속\n";
    echo "2. Moodle 연결 설정 입력\n";
    echo "3. 호흡 가이드 사용 시작\n\n";
    exit(0);
}

if (count($warnings) > 0) {
    echo "\n⚠ 경고 (" . count($warnings) . "개):\n";
    foreach ($warnings as $warning) {
        echo "  - $warning\n";
    }
}

if (count($errors) > 0) {
    echo "\n✗ 오류 (" . count($errors) . "개):\n";
    foreach ($errors as $error) {
        echo "  - $error\n";
    }
    echo "\n설치 가이드를 참조하여 문제를 해결하세요.\n";
    echo "문서: docs/INSTALLATION.md\n\n";
    exit(1);
}

echo "\n";
exit(0);
?>
