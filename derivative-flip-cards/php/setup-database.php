<?php
/**
 * Database Setup Script for Derivative Flip Cards
 *
 * This script creates the necessary tables in the Moodle database
 * Run this once to initialize the application
 *
 * MySQL 5.7 Compatible
 */

require_once __DIR__ . '/../config/database.php';

echo "=== Derivative Flip Cards Database Setup ===\n\n";

try {
    $pdo = getDatabaseConnection();
    echo "✓ Connected to database successfully\n\n";

    // Create derivative cards table
    echo "Creating derivative cards table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS " . TABLE_DERIVATIVE_CARDS . " (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT DEFAULT NULL,
        rule_name VARCHAR(255) NOT NULL,
        formula TEXT NOT NULL,
        example TEXT,
        description TEXT,
        display_order INT DEFAULT 0,
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_course_id (course_id),
        INDEX idx_display_order (display_order),
        INDEX idx_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "✓ Derivative cards table created\n\n";

    // Create student progress table
    echo "Creating student progress table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS " . TABLE_STUDENT_PROGRESS . " (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL DEFAULT 0,
        progress DECIMAL(5,2) DEFAULT 0.00,
        cards_viewed INT DEFAULT 0,
        cards_flipped INT DEFAULT 0,
        last_card_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_course (student_id, course_id),
        INDEX idx_student_id (student_id),
        INDEX idx_course_id (course_id),
        INDEX idx_progress (progress)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "✓ Student progress table created\n\n";

    // Create card events table (tracking)
    echo "Creating card events table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS " . TABLE_CARD_EVENTS . " (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        card_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        INDEX idx_card_id (card_id),
        INDEX idx_event_type (event_type),
        INDEX idx_event_timestamp (event_timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "✓ Card events table created\n\n";

    // Insert default derivative rules
    echo "Inserting default derivative rules...\n";

    $cards = [
        [
            'rule_name' => '상수 함수의 미분',
            'formula' => '$$\\frac{d}{dx}(c) = 0$$',
            'example' => '예: $$\\frac{d}{dx}(5) = 0$$',
            'description' => '상수의 미분은 항상 0입니다.',
            'order' => 1
        ],
        [
            'rule_name' => '거듭제곱 법칙',
            'formula' => '$$\\frac{d}{dx}(x^n) = nx^{n-1}$$',
            'example' => '예: $$\\frac{d}{dx}(x^3) = 3x^2$$',
            'description' => '지수를 앞으로 내리고 지수에서 1을 뺍니다.',
            'order' => 2
        ],
        [
            'rule_name' => '상수배 법칙',
            'formula' => '$$\\frac{d}{dx}[cf(x)] = c\\frac{d}{dx}f(x)$$',
            'example' => '예: $$\\frac{d}{dx}(5x^2) = 5 \\cdot 2x = 10x$$',
            'description' => '상수는 미분 기호 밖으로 꺼낼 수 있습니다.',
            'order' => 3
        ],
        [
            'rule_name' => '합의 법칙',
            'formula' => '$$\\frac{d}{dx}[f(x) + g(x)] = f\'(x) + g\'(x)$$',
            'example' => '예: $$\\frac{d}{dx}(x^2 + x^3) = 2x + 3x^2$$',
            'description' => '함수의 합의 미분은 각 함수를 따로 미분한 것의 합입니다.',
            'order' => 4
        ],
        [
            'rule_name' => '차의 법칙',
            'formula' => '$$\\frac{d}{dx}[f(x) - g(x)] = f\'(x) - g\'(x)$$',
            'example' => '예: $$\\frac{d}{dx}(x^3 - x^2) = 3x^2 - 2x$$',
            'description' => '함수의 차의 미분은 각 함수를 따로 미분한 것의 차입니다.',
            'order' => 5
        ],
        [
            'rule_name' => '곱의 법칙 (Product Rule)',
            'formula' => '$$\\frac{d}{dx}[f(x)g(x)] = f\'(x)g(x) + f(x)g\'(x)$$',
            'example' => '예: $$\\frac{d}{dx}(x^2 \\cdot x^3) = 2x \\cdot x^3 + x^2 \\cdot 3x^2$$',
            'description' => '첫 번째 함수의 미분 × 두 번째 + 첫 번째 × 두 번째의 미분',
            'order' => 6
        ],
        [
            'rule_name' => '몫의 법칙 (Quotient Rule)',
            'formula' => '$$\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f\'(x)g(x) - f(x)g\'(x)}{[g(x)]^2}$$',
            'example' => '예: $$\\frac{d}{dx}\\left(\\frac{x^2}{x}\\right) = \\frac{2x \\cdot x - x^2 \\cdot 1}{x^2}$$',
            'description' => '(분자의 미분 × 분모 - 분자 × 분모의 미분) / 분모²',
            'order' => 7
        ],
        [
            'rule_name' => '연쇄 법칙 (Chain Rule)',
            'formula' => '$$\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)$$',
            'example' => '예: $$\\frac{d}{dx}[(x^2 + 1)^3] = 3(x^2 + 1)^2 \\cdot 2x$$',
            'description' => '합성함수의 미분: 바깥 함수의 미분 × 안쪽 함수의 미분',
            'order' => 8
        ],
        [
            'rule_name' => '지수함수의 미분',
            'formula' => '$$\\frac{d}{dx}(e^x) = e^x$$',
            'example' => '예: $$\\frac{d}{dx}(e^{2x}) = 2e^{2x}$$',
            'description' => 'e^x의 미분은 자기 자신입니다.',
            'order' => 9
        ],
        [
            'rule_name' => '자연로그의 미분',
            'formula' => '$$\\frac{d}{dx}(\\ln x) = \\frac{1}{x}$$',
            'example' => '예: $$\\frac{d}{dx}(\\ln(x^2)) = \\frac{2x}{x^2} = \\frac{2}{x}$$',
            'description' => '자연로그 ln(x)의 미분은 1/x입니다.',
            'order' => 10
        ],
        [
            'rule_name' => 'sin 함수의 미분',
            'formula' => '$$\\frac{d}{dx}(\\sin x) = \\cos x$$',
            'example' => '예: $$\\frac{d}{dx}(\\sin 2x) = 2\\cos 2x$$',
            'description' => 'sin(x)를 미분하면 cos(x)입니다.',
            'order' => 11
        ],
        [
            'rule_name' => 'cos 함수의 미분',
            'formula' => '$$\\frac{d}{dx}(\\cos x) = -\\sin x$$',
            'example' => '예: $$\\frac{d}{dx}(\\cos 3x) = -3\\sin 3x$$',
            'description' => 'cos(x)를 미분하면 -sin(x)입니다.',
            'order' => 12
        ]
    ];

    $insertSql = "INSERT INTO " . TABLE_DERIVATIVE_CARDS . "
                  (rule_name, formula, example, description, display_order)
                  VALUES (:rule_name, :formula, :example, :description, :display_order)";

    $stmt = $pdo->prepare($insertSql);

    foreach ($cards as $card) {
        $stmt->execute([
            'rule_name' => $card['rule_name'],
            'formula' => $card['formula'],
            'example' => $card['example'],
            'description' => $card['description'],
            'display_order' => $card['order']
        ]);
    }

    echo "✓ Inserted " . count($cards) . " default derivative rules\n\n";

    echo "=== Setup completed successfully! ===\n";
    echo "\nYou can now use the Derivative Flip Cards application.\n";
    echo "Access it at: index.html\n\n";

} catch (PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
