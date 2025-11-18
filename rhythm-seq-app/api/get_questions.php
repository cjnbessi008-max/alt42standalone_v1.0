<?php
/**
 * Rhythm Seq - Get Questions API
 *
 * Retrieves sequence questions from Moodle database
 * Supports question types: sequence, arithmetic progression, geometric progression
 */

require_once '../config.php';

// Get parameters
$question_id = isset($_GET['id']) ? intval($_GET['id']) : null;
$category_id = isset($_GET['category']) ? intval($_GET['category']) : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

try {
    $pdo = get_db_connection();

    if ($question_id) {
        // Get specific question
        $stmt = $pdo->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                qc.name AS category,
                qa.value AS sequence_data
            FROM " . DB_PREFIX . "question q
            LEFT JOIN " . DB_PREFIX . "question_categories qc ON q.category = qc.id
            LEFT JOIN " . DB_PREFIX . "question_answers qa ON q.id = qa.question
            WHERE q.id = :id
            AND q.qtype IN ('shortanswer', 'numerical', 'essay')
            LIMIT 1
        ");
        $stmt->execute(['id' => $question_id]);
        $question = $stmt->fetch();

        if ($question) {
            // Parse sequence data from question text
            $sequence = parse_sequence_from_text($question['questiontext']);

            echo json_encode([
                'success' => true,
                'question' => [
                    'id' => $question['id'],
                    'title' => $question['name'],
                    'text' => strip_tags($question['questiontext']),
                    'category' => $question['category'],
                    'sequence' => $sequence
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Question not found'
            ]);
        }
    } else {
        // Get list of questions
        $query = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                qc.name AS category
            FROM " . DB_PREFIX . "question q
            LEFT JOIN " . DB_PREFIX . "question_categories qc ON q.category = qc.id
            WHERE q.qtype IN ('shortanswer', 'numerical', 'essay')
        ";

        if ($category_id) {
            $query .= " AND q.category = :category_id";
        }

        $query .= " ORDER BY q.id DESC LIMIT :limit";

        $stmt = $pdo->prepare($query);
        if ($category_id) {
            $stmt->bindValue(':category_id', $category_id, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $questions = $stmt->fetchAll();

        // Parse sequences from each question
        $parsed_questions = array_map(function($q) {
            return [
                'id' => $q['id'],
                'title' => $q['name'],
                'text' => strip_tags($q['questiontext']),
                'category' => $q['category'],
                'sequence' => parse_sequence_from_text($q['questiontext'])
            ];
        }, $questions);

        echo json_encode([
            'success' => true,
            'count' => count($parsed_questions),
            'questions' => $parsed_questions
        ]);
    }

} catch (PDOException $e) {
    handle_error("Database Error: " . $e->getMessage());
} catch (Exception $e) {
    handle_error("Error: " . $e->getMessage());
}

/**
 * Parse sequence numbers from question text
 * Looks for patterns like: [1, 2, 3, 4, 5] or "sequence: 2, 4, 6, 8"
 */
function parse_sequence_from_text($text) {
    // Remove HTML tags
    $clean_text = strip_tags($text);

    // Try to find sequence in brackets [1, 2, 3, 4]
    if (preg_match('/\[([0-9,\s]+)\]/', $clean_text, $matches)) {
        $numbers = array_map('trim', explode(',', $matches[1]));
        return array_map('intval', $numbers);
    }

    // Try to find sequence after "sequence:" or "수열:"
    if (preg_match('/(sequence|수열)[\s:]+([0-9,\s]+)/i', $clean_text, $matches)) {
        $numbers = array_map('trim', explode(',', $matches[2]));
        return array_map('intval', array_filter($numbers, 'is_numeric'));
    }

    // Try to find any comma-separated numbers
    if (preg_match('/([0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+)/', $clean_text, $matches)) {
        $numbers = array_map('trim', explode(',', $matches[0]));
        return array_map('intval', $numbers);
    }

    // Default: generate a sample sequence for demonstration
    return [1, 3, 5, 7, 9, 11, 13, 15];
}
?>
