<?php
/**
 * Function Mood Analyzer
 * Analyzes mathematical functions and determines their "mood" based on characteristics
 * PHP 7.1.9
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Database.php';

class FunctionAnalyzer {
    private $db;
    private $samplePoints;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->samplePoints = ANALYSIS_SAMPLE_POINTS;
    }

    /**
     * Analyze a mathematical function and determine its mood
     */
    public function analyze($problemId, $functionExpression, $domainMin = -10, $domainMax = 10) {
        // Sample the function
        $samples = $this->sampleFunction($functionExpression, $domainMin, $domainMax);

        if (empty($samples)) {
            throw new Exception("Failed to sample function: $functionExpression");
        }

        // Calculate characteristics
        $smoothness = $this->calculateSmoothness($samples);
        $steepness = $this->calculateSteepness($samples);
        $variation = $this->calculateVariation($samples);

        // Determine mood type
        $mood = $this->determineMood($smoothness, $steepness, $variation);

        // Get color and emotion label
        $moodConfig = $this->getMoodConfiguration($mood);

        // Store analysis
        $analysisId = $this->storeAnalysis(
            $problemId,
            $mood,
            $smoothness,
            $steepness,
            $variation,
            $moodConfig['color_code'],
            $moodConfig['emotion_label'],
            [
                'samples' => count($samples),
                'domain' => [$domainMin, $domainMax],
                'extrema' => $this->findExtrema($samples)
            ]
        );

        return [
            'id' => $analysisId,
            'mood_type' => $mood,
            'smoothness' => round($smoothness, 2),
            'steepness' => round($steepness, 2),
            'variation' => round($variation, 2),
            'color' => $moodConfig['color_code'],
            'emotion' => $moodConfig['emotion_label'],
            'description' => $moodConfig['description']
        ];
    }

    /**
     * Sample function at regular intervals
     */
    private function sampleFunction($expression, $xMin, $xMax) {
        $samples = [];
        $step = ($xMax - $xMin) / $this->samplePoints;

        // Sanitize expression for evaluation
        $expression = $this->sanitizeExpression($expression);

        for ($i = 0; $i <= $this->samplePoints; $i++) {
            $x = $xMin + ($i * $step);

            try {
                $y = $this->evaluateExpression($expression, $x);

                if (is_finite($y)) {
                    $samples[] = [
                        'x' => round($x, ANALYSIS_PRECISION),
                        'y' => round($y, ANALYSIS_PRECISION)
                    ];
                }
            } catch (Exception $e) {
                // Skip points that cause errors (e.g., division by zero)
                continue;
            }
        }

        return $samples;
    }

    /**
     * Sanitize mathematical expression
     */
    private function sanitizeExpression($expression) {
        // Replace common mathematical notations
        $expression = str_replace('^', '**', $expression); // Power operator
        $expression = preg_replace('/(\d)x/', '$1*x', $expression); // 2x -> 2*x
        $expression = preg_replace('/\)(\d)/', ')*$1', $expression); // )(digit -> )*(digit
        $expression = preg_replace('/(\d)\(/', '$1*(', $expression); // (digit)( -> (digit)*(

        // Replace math functions
        $mathFunctions = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'log', 'ln'];
        foreach ($mathFunctions as $func) {
            if ($func === 'ln') {
                $expression = str_replace('ln', 'log', $expression);
            }
        }

        return $expression;
    }

    /**
     * Safely evaluate mathematical expression
     */
    private function evaluateExpression($expression, $x) {
        // Replace x with actual value
        $expr = str_replace('x', "($x)", $expression);

        // Use eval with safety measures (only for mathematical expressions)
        // In production, use a proper math parser library
        $result = null;

        try {
            // Define allowed functions
            $sin = function($v) { return sin($v); };
            $cos = function($v) { return cos($v); };
            $tan = function($v) { return tan($v); };
            $sqrt = function($v) { return sqrt($v); };
            $abs = function($v) { return abs($v); };
            $exp = function($v) { return exp($v); };
            $log = function($v) { return log($v); };
            $pow = function($a, $b) { return pow($a, $b); };

            // Evaluate (sandboxed as much as possible)
            eval('$result = ' . $expr . ';');

            return $result;
        } catch (Throwable $e) {
            throw new Exception("Expression evaluation error: " . $e->getMessage());
        }
    }

    /**
     * Calculate smoothness score (0-100)
     * Higher score = smoother/more gradual changes
     */
    private function calculateSmoothness($samples) {
        if (count($samples) < 3) {
            return 50.0;
        }

        $secondDerivatives = [];

        for ($i = 1; $i < count($samples) - 1; $i++) {
            $dx1 = $samples[$i]['x'] - $samples[$i - 1]['x'];
            $dx2 = $samples[$i + 1]['x'] - $samples[$i]['x'];

            if ($dx1 == 0 || $dx2 == 0) continue;

            $dy1 = ($samples[$i]['y'] - $samples[$i - 1]['y']) / $dx1;
            $dy2 = ($samples[$i + 1]['y'] - $samples[$i]['y']) / $dx2;

            $secondDerivative = abs(($dy2 - $dy1) / (($dx1 + $dx2) / 2));
            $secondDerivatives[] = $secondDerivative;
        }

        if (empty($secondDerivatives)) {
            return 50.0;
        }

        // Average second derivative (curvature)
        $avgCurvature = array_sum($secondDerivatives) / count($secondDerivatives);

        // Normalize to 0-100 scale (inverse - higher curvature = lower smoothness)
        $smoothness = 100 / (1 + $avgCurvature);

        return min(100, max(0, $smoothness));
    }

    /**
     * Calculate steepness score (0-100)
     * Higher score = steeper/more dramatic changes
     */
    private function calculateSteepness($samples) {
        if (count($samples) < 2) {
            return 50.0;
        }

        $slopes = [];

        for ($i = 1; $i < count($samples); $i++) {
            $dx = $samples[$i]['x'] - $samples[$i - 1]['x'];

            if ($dx == 0) continue;

            $dy = $samples[$i]['y'] - $samples[$i - 1]['y'];
            $slope = abs($dy / $dx);
            $slopes[] = $slope;
        }

        if (empty($slopes)) {
            return 50.0;
        }

        // Use max slope as primary indicator
        $maxSlope = max($slopes);

        // Normalize to 0-100 scale
        $steepness = min(100, $maxSlope * 10);

        return $steepness;
    }

    /**
     * Calculate variation score (0-100)
     * Higher score = more variation in slope
     */
    private function calculateVariation($samples) {
        if (count($samples) < 2) {
            return 50.0;
        }

        $slopes = [];

        for ($i = 1; $i < count($samples); $i++) {
            $dx = $samples[$i]['x'] - $samples[$i - 1]['x'];

            if ($dx == 0) continue;

            $dy = $samples[$i]['y'] - $samples[$i - 1]['y'];
            $slopes[] = $dy / $dx;
        }

        if (empty($slopes)) {
            return 50.0;
        }

        // Calculate standard deviation of slopes
        $mean = array_sum($slopes) / count($slopes);
        $variance = 0;

        foreach ($slopes as $slope) {
            $variance += pow($slope - $mean, 2);
        }

        $variance /= count($slopes);
        $stdDev = sqrt($variance);

        // Normalize to 0-100 scale
        $variation = min(100, $stdDev * 20);

        return $variation;
    }

    /**
     * Determine mood type based on characteristics
     */
    private function determineMood($smoothness, $steepness, $variation) {
        // Get all mood configurations
        $moods = $this->db->fetchAll(
            "SELECT * FROM mood_configurations WHERE is_active = 1 ORDER BY id"
        );

        // Find best matching mood
        $bestMatch = null;
        $bestScore = -1;

        foreach ($moods as $mood) {
            $score = 0;

            // Check smoothness range
            if ($smoothness >= $mood['smoothness_min'] && $smoothness <= $mood['smoothness_max']) {
                $score += 10;
            }

            // Check steepness range
            if ($steepness >= $mood['steepness_min'] && $steepness <= $mood['steepness_max']) {
                $score += 10;
            }

            // Calculate distance from ideal center
            $smoothnessCenter = ($mood['smoothness_min'] + $mood['smoothness_max']) / 2;
            $steepnessCenter = ($mood['steepness_min'] + $mood['steepness_max']) / 2;

            $distance = sqrt(
                pow($smoothness - $smoothnessCenter, 2) +
                pow($steepness - $steepnessCenter, 2)
            );

            $score += max(0, 100 - $distance);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $mood['mood_type'];
            }
        }

        return $bestMatch ?? 'steady';
    }

    /**
     * Get mood configuration
     */
    private function getMoodConfiguration($moodType) {
        return $this->db->fetchOne(
            "SELECT * FROM mood_configurations WHERE mood_type = :type",
            ['type' => $moodType]
        );
    }

    /**
     * Find extrema (local min/max) in samples
     */
    private function findExtrema($samples) {
        $extrema = ['minima' => [], 'maxima' => []];

        for ($i = 1; $i < count($samples) - 1; $i++) {
            $prev = $samples[$i - 1]['y'];
            $curr = $samples[$i]['y'];
            $next = $samples[$i + 1]['y'];

            if ($curr > $prev && $curr > $next) {
                $extrema['maxima'][] = $samples[$i];
            } elseif ($curr < $prev && $curr < $next) {
                $extrema['minima'][] = $samples[$i];
            }
        }

        return $extrema;
    }

    /**
     * Store analysis results
     */
    private function storeAnalysis($problemId, $moodType, $smoothness, $steepness, $variation, $color, $emotion, $data) {
        $sql = "
            INSERT INTO function_analysis
            (problem_id, mood_type, smoothness_score, steepness_score, variation_score, color_code, emotion_label, analysis_data)
            VALUES (:problem_id, :mood, :smoothness, :steepness, :variation, :color, :emotion, :data)
        ";

        return $this->db->insert($sql, [
            'problem_id' => $problemId,
            'mood' => $moodType,
            'smoothness' => $smoothness,
            'steepness' => $steepness,
            'variation' => $variation,
            'color' => $color,
            'emotion' => $emotion,
            'data' => json_encode($data)
        ]);
    }

    /**
     * Get existing analysis for a problem
     */
    public function getAnalysis($problemId) {
        return $this->db->fetchOne(
            "SELECT * FROM function_analysis WHERE problem_id = :id ORDER BY created_at DESC LIMIT 1",
            ['id' => $problemId]
        );
    }
}
