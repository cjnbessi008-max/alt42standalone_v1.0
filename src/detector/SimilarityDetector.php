<?php
/**
 * Similarity Detector
 * Automatically extracts similarity hints from math problems
 */

namespace SimilarityDetector\Detector;

use PDO;

class SimilarityDetector
{
    private $db;
    private $minConfidence;
    private $maxHints;

    /**
     * Constructor
     * @param PDO $db Database connection
     * @param float $minConfidence Minimum confidence threshold (0-1)
     * @param int $maxHints Maximum hints per problem
     */
    public function __construct(PDO $db, $minConfidence = 0.70, $maxHints = 5)
    {
        $this->db = $db;
        $this->minConfidence = $minConfidence;
        $this->maxHints = $maxHints;
    }

    /**
     * Detect similarity hints from a problem
     * @param array $problem Problem data from Moodle
     * @return array Detected hints
     */
    public function detectHints(array $problem)
    {
        $startTime = microtime(true);
        $hints = [];

        try {
            // Store problem in database
            $problemId = $this->storeProblem($problem);

            // Extract geometric shapes
            $shapes = $this->extractShapes($problem['questiontext']);
            $shapesCount = count($shapes);

            // Store shapes
            foreach ($shapes as $shape) {
                $this->storeShape($problemId, $shape);
            }

            // Detect similarity patterns
            if ($shapesCount >= 2) {
                $hints = array_merge($hints, $this->detectRatioHints($shapes));
                $hints = array_merge($hints, $this->detectAngleHints($shapes));
                $hints = array_merge($hints, $this->detectProportionHints($shapes));
                $hints = array_merge($hints, $this->detectTransformationHints($shapes));
            }

            // Filter by confidence and limit
            $hints = $this->filterHints($hints);

            // Store hints
            foreach ($hints as $hint) {
                $this->storeHint($problemId, $hint);
            }

            // Log detection
            $executionTime = (microtime(true) - $startTime) * 1000;
            $this->logDetection($problemId, $shapesCount, count($hints), 'success', $executionTime);

            return [
                'problem_id' => $problemId,
                'shapes_detected' => $shapesCount,
                'hints' => $hints,
                'execution_time_ms' => round($executionTime, 2),
            ];

        } catch (\Exception $e) {
            $executionTime = (microtime(true) - $startTime) * 1000;
            if (isset($problemId)) {
                $this->logDetection($problemId, 0, 0, 'failed', $executionTime, $e->getMessage());
            }
            throw $e;
        }
    }

    /**
     * Extract geometric shapes from question text
     * @param string $text Question text
     * @return array Extracted shapes
     */
    private function extractShapes($text)
    {
        $shapes = [];

        // Pattern: Triangle with sides
        if (preg_match_all('/삼각형\s*([A-Z]{3})[^\d]*?([0-9.]+)\s*cm[^\d]*?([0-9.]+)\s*cm[^\d]*?([0-9.]+)\s*cm/u', $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $shapes[] = [
                    'type' => 'triangle',
                    'name' => $match[1],
                    'properties' => [
                        'sides' => [(float)$match[2], (float)$match[3], (float)$match[4]]
                    ]
                ];
            }
        }

        // Pattern: Rectangle with dimensions
        if (preg_match_all('/직사각형\s*([A-Z]{4})[^\d]*?([0-9.]+)[^\d]*?([0-9.]+)/u', $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $shapes[] = [
                    'type' => 'rectangle',
                    'name' => $match[1],
                    'properties' => [
                        'width' => (float)$match[2],
                        'height' => (float)$match[3]
                    ]
                ];
            }
        }

        // Pattern: Circle with radius
        if (preg_match_all('/원[^\d]*?반지름[^\d]*?([0-9.]+)\s*cm/u', $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $index => $match) {
                $shapes[] = [
                    'type' => 'circle',
                    'name' => 'Circle' . ($index + 1),
                    'properties' => [
                        'radius' => (float)$match[1]
                    ]
                ];
            }
        }

        // Pattern: Ratio information
        if (preg_match_all('/([A-Z]{2})\s*:\s*([A-Z]{2})\s*=\s*([0-9]+)\s*:\s*([0-9]+)/u', $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $shapes[] = [
                    'type' => 'ratio',
                    'name' => $match[1] . '-' . $match[2],
                    'properties' => [
                        'segment1' => $match[1],
                        'segment2' => $match[2],
                        'ratio' => [(int)$match[3], (int)$match[4]]
                    ]
                ];
            }
        }

        return $shapes;
    }

    /**
     * Detect ratio-based hints
     * @param array $shapes Extracted shapes
     * @return array Hints
     */
    private function detectRatioHints(array $shapes)
    {
        $hints = [];

        // Compare triangles
        $triangles = array_filter($shapes, function($s) { return $s['type'] === 'triangle'; });
        if (count($triangles) >= 2) {
            $triangleArray = array_values($triangles);
            for ($i = 0; $i < count($triangleArray) - 1; $i++) {
                for ($j = $i + 1; $j < count($triangleArray); $j++) {
                    $t1 = $triangleArray[$i];
                    $t2 = $triangleArray[$j];

                    if (isset($t1['properties']['sides']) && isset($t2['properties']['sides'])) {
                        $ratio = $this->calculateSideRatio($t1['properties']['sides'], $t2['properties']['sides']);
                        if ($ratio > 0) {
                            $hints[] = [
                                'type' => 'ratio',
                                'text' => sprintf(
                                    '두 삼각형 %s와 %s의 대응하는 변의 길이의 비를 확인해보세요. 닮음비는 %.2f:1입니다.',
                                    $t1['name'], $t2['name'], $ratio
                                ),
                                'data' => [
                                    'shape1' => $t1['name'],
                                    'shape2' => $t2['name'],
                                    'ratio' => $ratio,
                                    'sides1' => $t1['properties']['sides'],
                                    'sides2' => $t2['properties']['sides']
                                ],
                                'confidence' => $this->calculateConfidence($ratio)
                            ];
                        }
                    }
                }
            }
        }

        // Compare rectangles
        $rectangles = array_filter($shapes, function($s) { return $s['type'] === 'rectangle'; });
        if (count($rectangles) >= 2) {
            $rectArray = array_values($rectangles);
            for ($i = 0; $i < count($rectArray) - 1; $i++) {
                for ($j = $i + 1; $j < count($rectArray); $j++) {
                    $r1 = $rectArray[$i];
                    $r2 = $rectArray[$j];

                    $widthRatio = $r1['properties']['width'] / $r2['properties']['width'];
                    $heightRatio = $r1['properties']['height'] / $r2['properties']['height'];

                    if (abs($widthRatio - $heightRatio) < 0.01) {
                        $hints[] = [
                            'type' => 'proportion',
                            'text' => sprintf(
                                '직사각형 %s와 %s의 대응하는 변의 비가 같습니다. 닮음비는 %.2f:1입니다.',
                                $r1['name'], $r2['name'], $widthRatio
                            ),
                            'data' => [
                                'shape1' => $r1['name'],
                                'shape2' => $r2['name'],
                                'width_ratio' => $widthRatio,
                                'height_ratio' => $heightRatio
                            ],
                            'confidence' => 0.95
                        ];
                    }
                }
            }
        }

        // Compare circles
        $circles = array_filter($shapes, function($s) { return $s['type'] === 'circle'; });
        if (count($circles) >= 2) {
            $circleArray = array_values($circles);
            for ($i = 0; $i < count($circleArray) - 1; $i++) {
                for ($j = $i + 1; $j < count($circleArray); $j++) {
                    $c1 = $circleArray[$i];
                    $c2 = $circleArray[$j];

                    $ratio = $c1['properties']['radius'] / $c2['properties']['radius'];
                    $hints[] = [
                        'type' => 'shape',
                        'text' => sprintf(
                            '모든 원은 서로 닮은 도형입니다. 두 원의 닮음비는 %.2f:1입니다.',
                            $ratio
                        ),
                        'data' => [
                            'radius1' => $c1['properties']['radius'],
                            'radius2' => $c2['properties']['radius'],
                            'ratio' => $ratio
                        ],
                        'confidence' => 0.98
                    ];
                }
            }
        }

        return $hints;
    }

    /**
     * Detect angle-based hints
     * @param array $shapes Extracted shapes
     * @return array Hints
     */
    private function detectAngleHints(array $shapes)
    {
        $hints = [];

        // Check for right triangles
        foreach ($shapes as $shape) {
            if ($shape['type'] === 'triangle' && isset($shape['properties']['sides'])) {
                $sides = $shape['properties']['sides'];
                sort($sides);

                // Pythagorean theorem check
                $aSquared = $sides[0] * $sides[0];
                $bSquared = $sides[1] * $sides[1];
                $cSquared = $sides[2] * $sides[2];

                if (abs(($aSquared + $bSquared) - $cSquared) < 0.01) {
                    $hints[] = [
                        'type' => 'angle',
                        'text' => sprintf(
                            '삼각형 %s는 직각삼각형입니다. 피타고라스 정리를 이용하여 확인할 수 있습니다.',
                            $shape['name']
                        ),
                        'data' => [
                            'shape' => $shape['name'],
                            'sides' => $sides,
                            'is_right_triangle' => true
                        ],
                        'confidence' => 0.92
                    ];
                }
            }
        }

        return $hints;
    }

    /**
     * Detect proportion hints
     * @param array $shapes Extracted shapes
     * @return array Hints
     */
    private function detectProportionHints(array $shapes)
    {
        $hints = [];

        $ratios = array_filter($shapes, function($s) { return $s['type'] === 'ratio'; });

        if (count($ratios) >= 2) {
            $ratioArray = array_values($ratios);
            $allEqual = true;
            $firstRatio = $ratioArray[0]['properties']['ratio'][0] / $ratioArray[0]['properties']['ratio'][1];

            foreach ($ratioArray as $ratio) {
                $currentRatio = $ratio['properties']['ratio'][0] / $ratio['properties']['ratio'][1];
                if (abs($currentRatio - $firstRatio) > 0.01) {
                    $allEqual = false;
                    break;
                }
            }

            if ($allEqual) {
                $hints[] = [
                    'type' => 'proportion',
                    'text' => '대응하는 변의 비가 모두 같으면 두 도형은 닮은 도형입니다.',
                    'data' => [
                        'ratios' => array_map(function($r) {
                            return $r['properties']['ratio'];
                        }, $ratioArray),
                        'all_equal' => true
                    ],
                    'confidence' => 0.93
                ];
            }
        }

        return $hints;
    }

    /**
     * Detect transformation hints
     * @param array $shapes Extracted shapes
     * @return array Hints
     */
    private function detectTransformationHints(array $shapes)
    {
        $hints = [];

        if (count($shapes) >= 2) {
            $hints[] = [
                'type' => 'transformation',
                'text' => '닮음 변환을 통해 한 도형을 다른 도형으로 변환할 수 있는지 확인해보세요. (확대, 축소, 회전, 대칭)',
                'data' => [
                    'transformations' => ['scale', 'rotate', 'reflect']
                ],
                'confidence' => 0.75
            ];
        }

        return $hints;
    }

    /**
     * Calculate side ratio between two triangles
     * @param array $sides1 First triangle sides
     * @param array $sides2 Second triangle sides
     * @return float Ratio or 0 if not similar
     */
    private function calculateSideRatio(array $sides1, array $sides2)
    {
        sort($sides1);
        sort($sides2);

        $ratio1 = $sides1[0] / $sides2[0];
        $ratio2 = $sides1[1] / $sides2[1];
        $ratio3 = $sides1[2] / $sides2[2];

        // Check if all ratios are approximately equal
        if (abs($ratio1 - $ratio2) < 0.01 && abs($ratio2 - $ratio3) < 0.01) {
            return $ratio1;
        }

        return 0;
    }

    /**
     * Calculate confidence score based on ratio
     * @param float $ratio Similarity ratio
     * @return float Confidence score (0-1)
     */
    private function calculateConfidence($ratio)
    {
        // Higher confidence for simple ratios
        $simpleRatios = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

        foreach ($simpleRatios as $simple) {
            if (abs($ratio - $simple) < 0.1) {
                return 0.95;
            }
        }

        return 0.85;
    }

    /**
     * Filter hints by confidence and limit
     * @param array $hints All hints
     * @return array Filtered hints
     */
    private function filterHints(array $hints)
    {
        // Filter by confidence
        $hints = array_filter($hints, function($hint) {
            return $hint['confidence'] >= $this->minConfidence;
        });

        // Sort by confidence (descending)
        usort($hints, function($a, $b) {
            return $b['confidence'] <=> $a['confidence'];
        });

        // Limit number of hints
        return array_slice($hints, 0, $this->maxHints);
    }

    /**
     * Store problem in database
     * @param array $problem Problem data
     * @return int Problem ID
     */
    private function storeProblem(array $problem)
    {
        $sql = "INSERT INTO problems (moodle_question_id, question_text, question_type, difficulty_level, subject, grade_level)
                VALUES (:moodle_id, :text, :type, :difficulty, :subject, :grade)
                ON DUPLICATE KEY UPDATE
                question_text = VALUES(question_text),
                updated_at = CURRENT_TIMESTAMP";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'moodle_id' => $problem['id'],
            'text' => $problem['questiontext'],
            'type' => $problem['qtype'] ?? 'unknown',
            'difficulty' => 'medium',
            'subject' => 'mathematics',
            'grade' => '중학교 2학년'
        ]);

        // Get the inserted ID
        $sql = "SELECT id FROM problems WHERE moodle_question_id = :moodle_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['moodle_id' => $problem['id']]);

        return $stmt->fetchColumn();
    }

    /**
     * Store shape in database
     * @param int $problemId Problem ID
     * @param array $shape Shape data
     */
    private function storeShape($problemId, array $shape)
    {
        $sql = "INSERT INTO geometric_shapes (problem_id, shape_type, properties)
                VALUES (:problem_id, :type, :properties)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'problem_id' => $problemId,
            'type' => $shape['type'],
            'properties' => json_encode($shape['properties'])
        ]);
    }

    /**
     * Store hint in database
     * @param int $problemId Problem ID
     * @param array $hint Hint data
     */
    private function storeHint($problemId, array $hint)
    {
        $sql = "INSERT INTO similarity_hints (problem_id, hint_type, hint_text, hint_data, confidence_score)
                VALUES (:problem_id, :type, :text, :data, :confidence)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'problem_id' => $problemId,
            'type' => $hint['type'],
            'text' => $hint['text'],
            'data' => json_encode($hint['data']),
            'confidence' => $hint['confidence']
        ]);
    }

    /**
     * Log detection execution
     */
    private function logDetection($problemId, $shapesCount, $hintsCount, $status, $executionTime, $errorMessage = null)
    {
        $sql = "INSERT INTO detection_logs (problem_id, algorithm_version, execution_time_ms, shapes_detected, hints_generated, status, error_message)
                VALUES (:problem_id, :version, :time, :shapes, :hints, :status, :error)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'problem_id' => $problemId,
            'version' => '1.0.0',
            'time' => round($executionTime),
            'shapes' => $shapesCount,
            'hints' => $hintsCount,
            'status' => $status,
            'error' => $errorMessage
        ]);
    }

    /**
     * Get hints for a problem
     * @param int $problemId Problem ID
     * @return array Hints
     */
    public function getHints($problemId)
    {
        $sql = "SELECT * FROM similarity_hints
                WHERE problem_id = :problem_id AND is_active = 1
                ORDER BY confidence_score DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['problem_id' => $problemId]);

        $hints = $stmt->fetchAll();

        // Decode JSON data
        foreach ($hints as &$hint) {
            $hint['hint_data'] = json_decode($hint['hint_data'], true);
        }

        return $hints;
    }
}
