<?php
/**
 * Component Decomposer
 * Breaks down problems into Lego-like components
 */

class ComponentDecomposer {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Decompose a question into components
     * @param array $question Moodle question data
     * @return array Components and assembly patterns
     */
    public function decompose($question) {
        $questionType = $this->detectQuestionType($question);

        switch ($questionType) {
            case 'chemistry':
                return $this->decomposeChemistry($question);
            case 'mathematics':
                return $this->decomposeMathematics($question);
            case 'physics':
                return $this->decomposePhysics($question);
            default:
                return $this->decomposeGeneric($question);
        }
    }

    /**
     * Detect question type from Moodle question data
     * @param array $question
     * @return string Question type
     */
    private function detectQuestionType($question) {
        $text = strtolower($question['questiontext'] ?? '');

        // Chemistry keywords
        if (preg_match('/(분자|원자|화학|molecule|atom|chemical|H2O|CO2|bond)/iu', $text)) {
            return 'chemistry';
        }

        // Mathematics keywords
        if (preg_match('/(분수|방정식|숫자|fraction|equation|number|calculate|\+|\-|\×|÷)/iu', $text)) {
            return 'mathematics';
        }

        // Physics keywords
        if (preg_match('/(힘|속도|벡터|force|velocity|vector|newton)/iu', $text)) {
            return 'physics';
        }

        return 'generic';
    }

    /**
     * Decompose chemistry problems
     * @param array $question
     * @return array
     */
    private function decomposeChemistry($question) {
        $text = $question['questiontext'] ?? '';
        $components = [];
        $patterns = [];

        // Extract chemical formula (e.g., H2O, CO2, CH4)
        if (preg_match('/([A-Z][a-z]?\d*)+/', $text, $matches)) {
            $formula = $matches[0];
            $atoms = $this->parseChemicalFormula($formula);

            // Create atom components
            foreach ($atoms as $symbol => $count) {
                $atomData = $this->getAtomData($symbol);
                for ($i = 0; $i < $count; $i++) {
                    $components[] = [
                        'component_type' => 'atom',
                        'symbol' => $symbol,
                        'display_name' => $atomData['name'],
                        'display_text' => $atomData['korean_name'] . ' (' . $symbol . ')',
                        'color' => $atomData['color'],
                        'properties' => json_encode([
                            'atomic_number' => $atomData['atomic_number'],
                            'valence' => $atomData['valence']
                        ]),
                        'visual_config' => json_encode([
                            'shape' => 'circle',
                            'size' => 40 + ($atomData['atomic_number'] / 10),
                            'border' => '#333333'
                        ]),
                        'quantity' => 1
                    ];
                }
            }

            // Add bond components
            $bondCount = array_sum($atoms) - 1; // Simple linear structure
            if ($bondCount > 0) {
                $components[] = [
                    'component_type' => 'bond',
                    'symbol' => '-',
                    'display_name' => 'Single Bond',
                    'display_text' => '단일 결합',
                    'color' => '#333333',
                    'properties' => json_encode(['bond_type' => 'single']),
                    'visual_config' => json_encode([
                        'width' => 3,
                        'style' => 'solid'
                    ]),
                    'quantity' => $bondCount
                ];
            }

            // Create correct assembly pattern
            $patterns[] = $this->createChemistryPattern($formula, $atoms);
        }

        return [
            'components' => $components,
            'patterns' => $patterns,
            'question_type' => 'chemistry',
            'metadata' => ['formula' => $formula ?? '']
        ];
    }

    /**
     * Parse chemical formula into atoms and counts
     * @param string $formula
     * @return array ['H' => 2, 'O' => 1]
     */
    private function parseChemicalFormula($formula) {
        $atoms = [];
        preg_match_all('/([A-Z][a-z]?)(\d*)/', $formula, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $symbol = $match[1];
            $count = !empty($match[2]) ? (int)$match[2] : 1;
            $atoms[$symbol] = ($atoms[$symbol] ?? 0) + $count;
        }

        return $atoms;
    }

    /**
     * Get atom data from database or defaults
     * @param string $symbol
     * @return array
     */
    private function getAtomData($symbol) {
        // Predefined atom data (can be moved to database)
        $atomTable = [
            'H' => ['name' => 'Hydrogen', 'korean_name' => '수소', 'atomic_number' => 1, 'valence' => 1, 'color' => '#FFFFFF'],
            'C' => ['name' => 'Carbon', 'korean_name' => '탄소', 'atomic_number' => 6, 'valence' => 4, 'color' => '#000000'],
            'N' => ['name' => 'Nitrogen', 'korean_name' => '질소', 'atomic_number' => 7, 'valence' => 3, 'color' => '#0000FF'],
            'O' => ['name' => 'Oxygen', 'korean_name' => '산소', 'atomic_number' => 8, 'valence' => 2, 'color' => '#FF0000'],
            'S' => ['name' => 'Sulfur', 'korean_name' => '황', 'atomic_number' => 16, 'valence' => 2, 'color' => '#FFFF00'],
            'Cl' => ['name' => 'Chlorine', 'korean_name' => '염소', 'atomic_number' => 17, 'valence' => 1, 'color' => '#00FF00'],
        ];

        return $atomTable[$symbol] ?? [
            'name' => $symbol,
            'korean_name' => $symbol,
            'atomic_number' => 0,
            'valence' => 1,
            'color' => '#CCCCCC'
        ];
    }

    /**
     * Create chemistry assembly pattern
     * @param string $formula
     * @param array $atoms
     * @return array
     */
    private function createChemistryPattern($formula, $atoms) {
        $patternComponents = [];
        $connections = [];
        $x = 50;
        $componentId = 1;
        $previousId = null;

        foreach ($atoms as $symbol => $count) {
            for ($i = 0; $i < $count; $i++) {
                $patternComponents[] = [
                    'id' => $componentId,
                    'type' => 'atom',
                    'symbol' => $symbol,
                    'position' => ['x' => $x, 'y' => 100]
                ];

                if ($previousId !== null) {
                    $connections[] = [
                        'from' => $previousId,
                        'to' => $componentId,
                        'bond_type' => 'single'
                    ];
                }

                $previousId = $componentId;
                $componentId++;
                $x += 100;
            }
        }

        return [
            'pattern_name' => $formula . '_standard',
            'pattern_data' => json_encode([
                'components' => $patternComponents,
                'connections' => $connections,
                'structure' => $formula
            ]),
            'is_correct' => true,
            'confidence_score' => 1.00
        ];
    }

    /**
     * Decompose mathematics problems
     * @param array $question
     * @return array
     */
    private function decomposeMathematics($question) {
        $text = $question['questiontext'] ?? '';
        $components = [];
        $patterns = [];

        // Detect fraction (e.g., 3/4)
        if (preg_match('/(\d+)\s*\/\s*(\d+)/', $text, $matches)) {
            $numerator = $matches[1];
            $denominator = $matches[2];

            $components = [
                [
                    'component_type' => 'number',
                    'symbol' => $numerator,
                    'display_name' => "Number $numerator",
                    'display_text' => "숫자 $numerator",
                    'color' => '#2196F3',
                    'properties' => json_encode(['value' => (int)$numerator]),
                    'visual_config' => json_encode(['shape' => 'square', 'size' => 40]),
                    'quantity' => 1
                ],
                [
                    'component_type' => 'operator',
                    'symbol' => '/',
                    'display_name' => 'Fraction Bar',
                    'display_text' => '분수선',
                    'color' => '#000000',
                    'properties' => json_encode(['operator' => 'divide']),
                    'visual_config' => json_encode(['shape' => 'line', 'width' => 60, 'height' => 2]),
                    'quantity' => 1
                ],
                [
                    'component_type' => 'number',
                    'symbol' => $denominator,
                    'display_name' => "Number $denominator",
                    'display_text' => "숫자 $denominator",
                    'color' => '#2196F3',
                    'properties' => json_encode(['value' => (int)$denominator]),
                    'visual_config' => json_encode(['shape' => 'square', 'size' => 40]),
                    'quantity' => 1
                ]
            ];

            $patterns[] = [
                'pattern_name' => "fraction_{$numerator}_{$denominator}",
                'pattern_data' => json_encode([
                    'components' => [
                        ['id' => 1, 'type' => 'number', 'value' => $numerator, 'position' => ['x' => 150, 'y' => 80, 'layer' => 'numerator']],
                        ['id' => 2, 'type' => 'operator', 'symbol' => '/', 'position' => ['x' => 150, 'y' => 100, 'layer' => 'middle']],
                        ['id' => 3, 'type' => 'number', 'value' => $denominator, 'position' => ['x' => 150, 'y' => 120, 'layer' => 'denominator']]
                    ],
                    'structure' => "$numerator/$denominator"
                ]),
                'is_correct' => true
            ];
        }
        // Detect equation (e.g., 2x + 5 = 13)
        else if (preg_match('/(\d+)([a-z])\s*([+\-])\s*(\d+)\s*=\s*(\d+)/i', $text, $matches)) {
            $coeff = $matches[1];
            $variable = $matches[2];
            $operator = $matches[3];
            $constant = $matches[4];
            $result = $matches[5];

            $components = $this->createEquationComponents($coeff, $variable, $operator, $constant, $result);
            $patterns[] = $this->createEquationPattern($coeff, $variable, $operator, $constant, $result);
        }

        return [
            'components' => $components,
            'patterns' => $patterns,
            'question_type' => 'mathematics',
            'metadata' => []
        ];
    }

    /**
     * Create equation components
     */
    private function createEquationComponents($coeff, $variable, $operator, $constant, $result) {
        return [
            [
                'component_type' => 'number',
                'symbol' => $coeff,
                'display_name' => "Coefficient",
                'display_text' => "계수 $coeff",
                'color' => '#4CAF50',
                'properties' => json_encode(['value' => (int)$coeff]),
                'visual_config' => json_encode(['shape' => 'square', 'size' => 35]),
                'quantity' => 1
            ],
            [
                'component_type' => 'variable',
                'symbol' => $variable,
                'display_name' => "Variable $variable",
                'display_text' => "변수 $variable",
                'color' => '#9C27B0',
                'properties' => json_encode(['variable_name' => $variable]),
                'visual_config' => json_encode(['shape' => 'rounded_square', 'size' => 40]),
                'quantity' => 1
            ],
            [
                'component_type' => 'operator',
                'symbol' => $operator,
                'display_name' => $operator === '+' ? 'Plus' : 'Minus',
                'display_text' => $operator === '+' ? '더하기' : '빼기',
                'color' => '#FF9800',
                'properties' => json_encode(['operator' => $operator === '+' ? 'add' : 'subtract']),
                'visual_config' => json_encode(['shape' => 'symbol', 'size' => 30]),
                'quantity' => 1
            ],
            [
                'component_type' => 'number',
                'symbol' => $constant,
                'display_name' => "Constant",
                'display_text' => "상수 $constant",
                'color' => '#4CAF50',
                'properties' => json_encode(['value' => (int)$constant]),
                'visual_config' => json_encode(['shape' => 'square', 'size' => 35]),
                'quantity' => 1
            ],
            [
                'component_type' => 'operator',
                'symbol' => '=',
                'display_name' => 'Equals',
                'display_text' => '같음',
                'color' => '#000000',
                'properties' => json_encode(['operator' => 'equals']),
                'visual_config' => json_encode(['shape' => 'symbol', 'size' => 30]),
                'quantity' => 1
            ],
            [
                'component_type' => 'number',
                'symbol' => $result,
                'display_name' => "Result",
                'display_text' => "결과 $result",
                'color' => '#4CAF50',
                'properties' => json_encode(['value' => (int)$result]),
                'visual_config' => json_encode(['shape' => 'square', 'size' => 35]),
                'quantity' => 1
            ]
        ];
    }

    /**
     * Create equation pattern
     */
    private function createEquationPattern($coeff, $variable, $operator, $constant, $result) {
        $x = 50;
        return [
            'pattern_name' => "equation_{$coeff}{$variable}{$operator}{$constant}={$result}",
            'pattern_data' => json_encode([
                'components' => [
                    ['id' => 1, 'type' => 'number', 'value' => $coeff, 'position' => ['x' => $x, 'y' => 100]],
                    ['id' => 2, 'type' => 'variable', 'symbol' => $variable, 'position' => ['x' => $x + 50, 'y' => 100]],
                    ['id' => 3, 'type' => 'operator', 'symbol' => $operator, 'position' => ['x' => $x + 100, 'y' => 100]],
                    ['id' => 4, 'type' => 'number', 'value' => $constant, 'position' => ['x' => $x + 150, 'y' => 100]],
                    ['id' => 5, 'type' => 'operator', 'symbol' => '=', 'position' => ['x' => $x + 200, 'y' => 100]],
                    ['id' => 6, 'type' => 'number', 'value' => $result, 'position' => ['x' => $x + 250, 'y' => 100]]
                ],
                'structure' => "{$coeff}{$variable} {$operator} {$constant} = {$result}"
            ]),
            'is_correct' => true
        ];
    }

    /**
     * Decompose physics problems
     * @param array $question
     * @return array
     */
    private function decomposePhysics($question) {
        // Placeholder for physics decomposition
        return $this->decomposeGeneric($question);
    }

    /**
     * Generic decomposition fallback
     * @param array $question
     * @return array
     */
    private function decomposeGeneric($question) {
        return [
            'components' => [],
            'patterns' => [],
            'question_type' => 'generic',
            'metadata' => []
        ];
    }

    /**
     * Save decomposed components to database
     * @param int $questionId
     * @param array $decomposed
     * @return bool
     */
    public function saveComponents($questionId, $decomposed) {
        try {
            $this->db->beginTransaction();

            // Insert components
            foreach ($decomposed['components'] as $component) {
                $component['question_id'] = $questionId;
                $this->insertComponent($component);
            }

            // Insert patterns
            foreach ($decomposed['patterns'] as $pattern) {
                $pattern['question_id'] = $questionId;
                $this->insertPattern($pattern);
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Failed to save components: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Insert component into database
     */
    private function insertComponent($component) {
        $sql = "INSERT INTO components (question_id, component_type, symbol, display_name, display_text, color, properties, visual_config, quantity)
                VALUES (:question_id, :component_type, :symbol, :display_name, :display_text, :color, :properties, :visual_config, :quantity)";

        return $this->db->execute($sql, $component);
    }

    /**
     * Insert pattern into database
     */
    private function insertPattern($pattern) {
        $sql = "INSERT INTO assembly_patterns (question_id, pattern_name, pattern_data, is_correct, confidence_score)
                VALUES (:question_id, :pattern_name, :pattern_data, :is_correct, :confidence_score)";

        $params = [
            'question_id' => $pattern['question_id'],
            'pattern_name' => $pattern['pattern_name'],
            'pattern_data' => $pattern['pattern_data'],
            'is_correct' => $pattern['is_correct'] ? 1 : 0,
            'confidence_score' => $pattern['confidence_score'] ?? 1.00
        ];

        return $this->db->execute($sql, $params);
    }
}
