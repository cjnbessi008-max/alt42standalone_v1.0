<?php
/**
 * CombinationBlock Model
 * Handles combination block data operations
 */

class CombinationBlock {
    private $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    /**
     * Get all active blocks
     * @return array
     */
    public function getAll() {
        $stmt = $this->pdo->query("
            SELECT id, moodle_question_id, title, description,
                   target_combination, difficulty_level, max_blocks,
                   time_limit, created_at, updated_at
            FROM combination_blocks
            WHERE is_active = 1
            ORDER BY created_at DESC
        ");

        return $stmt->fetchAll();
    }

    /**
     * Get block by ID with all elements
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        // Get block info
        $stmt = $this->pdo->prepare("
            SELECT id, moodle_question_id, title, description,
                   target_combination, difficulty_level, max_blocks,
                   time_limit, created_at, updated_at
            FROM combination_blocks
            WHERE id = :id AND is_active = 1
        ");
        $stmt->execute(['id' => $id]);
        $block = $stmt->fetch();

        if (!$block) {
            return null;
        }

        // Get block elements
        $stmt = $this->pdo->prepare("
            SELECT id, element_type, element_value, display_text,
                   color_code, icon_url, sort_order,
                   is_unlimited, max_uses
            FROM block_elements
            WHERE combination_block_id = :blockId
            ORDER BY sort_order ASC
        ");
        $stmt->execute(['blockId' => $id]);
        $block['elements'] = $stmt->fetchAll();

        return $block;
    }

    /**
     * Create new combination block
     * @param array $data
     * @return int Block ID
     */
    public function create($data) {
        $this->pdo->beginTransaction();

        try {
            // Insert block
            $stmt = $this->pdo->prepare("
                INSERT INTO combination_blocks
                (moodle_question_id, title, description, target_combination,
                 difficulty_level, max_blocks, time_limit)
                VALUES (:moodleQuestionId, :title, :description, :targetCombination,
                        :difficultyLevel, :maxBlocks, :timeLimit)
            ");

            $stmt->execute([
                'moodleQuestionId' => $data['moodle_question_id'] ?? 0,
                'title' => $data['title'],
                'description' => $data['description'] ?? '',
                'targetCombination' => $data['target_combination'],
                'difficultyLevel' => $data['difficulty_level'] ?? 1,
                'maxBlocks' => $data['max_blocks'] ?? 10,
                'timeLimit' => $data['time_limit'] ?? null
            ]);

            $blockId = $this->pdo->lastInsertId();

            // Insert elements if provided
            if (isset($data['elements']) && is_array($data['elements'])) {
                $stmt = $this->pdo->prepare("
                    INSERT INTO block_elements
                    (combination_block_id, element_type, element_value, display_text,
                     color_code, icon_url, sort_order, is_unlimited, max_uses)
                    VALUES (:blockId, :elementType, :elementValue, :displayText,
                            :colorCode, :iconUrl, :sortOrder, :isUnlimited, :maxUses)
                ");

                foreach ($data['elements'] as $index => $element) {
                    $stmt->execute([
                        'blockId' => $blockId,
                        'elementType' => $element['element_type'],
                        'elementValue' => $element['element_value'],
                        'displayText' => $element['display_text'],
                        'colorCode' => $element['color_code'] ?? '#3498db',
                        'iconUrl' => $element['icon_url'] ?? null,
                        'sortOrder' => $element['sort_order'] ?? $index,
                        'isUnlimited' => $element['is_unlimited'] ?? 0,
                        'maxUses' => $element['max_uses'] ?? 1
                    ]);
                }
            }

            $this->pdo->commit();
            return $blockId;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Check if a solution is correct
     * @param int $blockId
     * @param array $combinationData
     * @return bool
     */
    public function validateSolution($blockId, $combinationData) {
        // Get target combination
        $stmt = $this->pdo->prepare("
            SELECT target_combination
            FROM combination_blocks
            WHERE id = :blockId
        ");
        $stmt->execute(['blockId' => $blockId]);
        $block = $stmt->fetch();

        if (!$block) {
            return false;
        }

        // Calculate result from combination
        $result = $this->calculateCombination($blockId, $combinationData);

        // Compare with target
        return $result === $block['target_combination'];
    }

    /**
     * Calculate result from block combination
     * @param int $blockId
     * @param array $combinationData Array of element IDs
     * @return string|null
     */
    private function calculateCombination($blockId, $combinationData) {
        if (empty($combinationData)) {
            return null;
        }

        // Get element values
        $placeholders = implode(',', array_fill(0, count($combinationData), '?'));
        $stmt = $this->pdo->prepare("
            SELECT id, element_type, element_value
            FROM block_elements
            WHERE id IN ($placeholders)
            AND combination_block_id = ?
        ");
        $stmt->execute(array_merge($combinationData, [$blockId]));
        $elements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Create lookup array
        $elementMap = [];
        foreach ($elements as $element) {
            $elementMap[$element['id']] = $element;
        }

        // Build expression
        $expression = '';
        foreach ($combinationData as $elementId) {
            if (isset($elementMap[$elementId])) {
                $expression .= $elementMap[$elementId]['element_value'];
            }
        }

        // Evaluate simple mathematical expressions
        // Note: In production, use a proper expression parser
        try {
            // Simple evaluation for numbers and basic operators
            if (preg_match('/^[\d\+\-\*\/\(\)\s\.]+$/', $expression)) {
                $result = @eval("return $expression;");
                return (string)$result;
            }
            return $expression;
        } catch (Exception $e) {
            return $expression;
        }
    }
}
