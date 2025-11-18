<?php
/**
 * Zone Breeze - Inequality Solver
 *
 * Solves systems of linear inequalities and computes solution regions
 */

class InequalitySolver {
    private $inequalities = [];
    private $bounds = [];
    private $precision = 0.01;

    /**
     * Constructor
     *
     * @param array $inequalities Array of inequality strings
     * @param array $bounds Graph bounds ['xMin', 'xMax', 'yMin', 'yMax']
     */
    public function __construct($inequalities, $bounds = null) {
        $this->inequalities = $inequalities;
        $this->bounds = $bounds ?: [
            'xMin' => -10,
            'xMax' => 10,
            'yMin' => -10,
            'yMax' => 10
        ];
    }

    /**
     * Parse inequality string into components
     *
     * @param string $inequality Inequality string (e.g., "2x + 3y <= 6")
     * @return array Parsed components ['a', 'b', 'c', 'operator']
     */
    private function parseInequality($inequality) {
        // Remove spaces
        $inequality = preg_replace('/\s+/', '', $inequality);

        // Match pattern: ax + by operator c
        $pattern = '/^([+-]?\d*\.?\d*)x([+-]\d*\.?\d*)y([<>=]+)([+-]?\d+\.?\d*)$/';

        if (preg_match($pattern, $inequality, $matches)) {
            $a = $matches[1];
            $b = $matches[2];
            $operator = $matches[3];
            $c = $matches[4];

            // Handle implicit coefficient of 1
            if ($a === '' || $a === '+') $a = 1;
            if ($a === '-') $a = -1;
            if ($b === '' || $b === '+') $b = 1;
            if ($b === '-') $b = -1;

            return [
                'a' => (float)$a,
                'b' => (float)$b,
                'c' => (float)$c,
                'operator' => $operator,
                'original' => $inequality
            ];
        }

        // Handle simple inequalities like "x >= 0" or "y <= 5"
        $simplePattern = '/^([xy])([<>=]+)([+-]?\d+\.?\d*)$/';
        if (preg_match($simplePattern, $inequality, $matches)) {
            $var = $matches[1];
            $operator = $matches[2];
            $value = (float)$matches[3];

            if ($var === 'x') {
                return [
                    'a' => 1,
                    'b' => 0,
                    'c' => $value,
                    'operator' => $operator,
                    'original' => $inequality
                ];
            } else {
                return [
                    'a' => 0,
                    'b' => 1,
                    'c' => $value,
                    'operator' => $operator,
                    'original' => $inequality
                ];
            }
        }

        throw new Exception('Invalid inequality format: ' . $inequality);
    }

    /**
     * Check if a point satisfies an inequality
     *
     * @param float $x X coordinate
     * @param float $y Y coordinate
     * @param array $parsed Parsed inequality
     * @return bool True if point satisfies inequality
     */
    private function satisfiesInequality($x, $y, $parsed) {
        $value = $parsed['a'] * $x + $parsed['b'] * $y;

        switch ($parsed['operator']) {
            case '<':
                return $value < $parsed['c'];
            case '<=':
            case '≤':
                return $value <= $parsed['c'];
            case '>':
                return $value > $parsed['c'];
            case '>=':
            case '≥':
                return $value >= $parsed['c'];
            case '=':
            case '==':
                return abs($value - $parsed['c']) < $this->precision;
            default:
                return false;
        }
    }

    /**
     * Get intersection point of two lines
     *
     * @param array $line1 First line coefficients [a, b, c]
     * @param array $line2 Second line coefficients [a, b, c]
     * @return array|null Intersection point ['x', 'y'] or null if parallel
     */
    private function getIntersection($line1, $line2) {
        $a1 = $line1['a'];
        $b1 = $line1['b'];
        $c1 = $line1['c'];

        $a2 = $line2['a'];
        $b2 = $line2['b'];
        $c2 = $line2['c'];

        $det = $a1 * $b2 - $a2 * $b1;

        if (abs($det) < $this->precision) {
            return null; // Parallel lines
        }

        $x = ($c1 * $b2 - $c2 * $b1) / $det;
        $y = ($a1 * $c2 - $a2 * $c1) / $det;

        return ['x' => $x, 'y' => $y];
    }

    /**
     * Find all vertices of the solution region
     *
     * @return array Array of vertices [['x' => x, 'y' => y], ...]
     */
    public function findVertices() {
        $parsed = [];
        foreach ($this->inequalities as $inequality) {
            $parsed[] = $this->parseInequality($inequality);
        }

        // Add boundary constraints
        $bounds = [
            ['a' => 1, 'b' => 0, 'c' => $this->bounds['xMin'], 'operator' => '>='],
            ['a' => 1, 'b' => 0, 'c' => $this->bounds['xMax'], 'operator' => '<='],
            ['a' => 0, 'b' => 1, 'c' => $this->bounds['yMin'], 'operator' => '>='],
            ['a' => 0, 'b' => 1, 'c' => $this->bounds['yMax'], 'operator' => '<=']
        ];

        $allConstraints = array_merge($parsed, $bounds);
        $vertices = [];

        // Find intersection points
        $n = count($allConstraints);
        for ($i = 0; $i < $n; $i++) {
            for ($j = $i + 1; $j < $n; $j++) {
                $point = $this->getIntersection($allConstraints[$i], $allConstraints[$j]);

                if ($point === null) continue;

                // Check if point is within bounds
                if ($point['x'] < $this->bounds['xMin'] - $this->precision ||
                    $point['x'] > $this->bounds['xMax'] + $this->precision ||
                    $point['y'] < $this->bounds['yMin'] - $this->precision ||
                    $point['y'] > $this->bounds['yMax'] + $this->precision) {
                    continue;
                }

                // Check if point satisfies all inequalities
                $satisfiesAll = true;
                foreach ($parsed as $constraint) {
                    if (!$this->satisfiesInequality($point['x'], $point['y'], $constraint)) {
                        $satisfiesAll = false;
                        break;
                    }
                }

                if ($satisfiesAll) {
                    $vertices[] = $point;
                }
            }
        }

        // Remove duplicate vertices
        $vertices = $this->removeDuplicates($vertices);

        // Sort vertices by angle from centroid (for proper polygon ordering)
        if (count($vertices) > 0) {
            $vertices = $this->sortVerticesByAngle($vertices);
        }

        return $vertices;
    }

    /**
     * Remove duplicate vertices
     *
     * @param array $vertices Array of vertices
     * @return array Filtered vertices
     */
    private function removeDuplicates($vertices) {
        $unique = [];

        foreach ($vertices as $vertex) {
            $isDuplicate = false;
            foreach ($unique as $existing) {
                if (abs($vertex['x'] - $existing['x']) < $this->precision &&
                    abs($vertex['y'] - $existing['y']) < $this->precision) {
                    $isDuplicate = true;
                    break;
                }
            }
            if (!$isDuplicate) {
                $unique[] = $vertex;
            }
        }

        return $unique;
    }

    /**
     * Sort vertices by angle from centroid (counterclockwise)
     *
     * @param array $vertices Array of vertices
     * @return array Sorted vertices
     */
    private function sortVerticesByAngle($vertices) {
        if (count($vertices) < 2) {
            return $vertices;
        }

        // Calculate centroid
        $cx = array_sum(array_column($vertices, 'x')) / count($vertices);
        $cy = array_sum(array_column($vertices, 'y')) / count($vertices);

        // Calculate angles
        foreach ($vertices as &$vertex) {
            $vertex['_angle'] = atan2($vertex['y'] - $cy, $vertex['x'] - $cx);
        }

        // Sort by angle
        usort($vertices, function($a, $b) {
            return $a['_angle'] <=> $b['_angle'];
        });

        // Remove temporary angle property
        foreach ($vertices as &$vertex) {
            unset($vertex['_angle']);
        }

        return $vertices;
    }

    /**
     * Calculate energy intensity at a point
     * (How well the point satisfies all inequalities)
     *
     * @param float $x X coordinate
     * @param float $y Y coordinate
     * @return float Energy intensity (0.0 to 1.0)
     */
    public function calculateEnergyIntensity($x, $y) {
        $parsed = [];
        foreach ($this->inequalities as $inequality) {
            $parsed[] = $this->parseInequality($inequality);
        }

        $totalSatisfaction = 0;
        $count = 0;

        foreach ($parsed as $constraint) {
            $value = $constraint['a'] * $x + $constraint['b'] * $y;
            $threshold = $constraint['c'];

            // Calculate how much the inequality is satisfied
            $satisfaction = 0;

            switch ($constraint['operator']) {
                case '<':
                case '<=':
                case '≤':
                    if ($value <= $threshold) {
                        // More satisfied if value is much less than threshold
                        $satisfaction = 1.0 - min(1.0, abs($value - $threshold) / 10.0);
                    }
                    break;
                case '>':
                case '>=':
                case '≥':
                    if ($value >= $threshold) {
                        $satisfaction = 1.0 - min(1.0, abs($value - $threshold) / 10.0);
                    }
                    break;
            }

            $totalSatisfaction += max(0, $satisfaction);
            $count++;
        }

        return $count > 0 ? $totalSatisfaction / $count : 0;
    }

    /**
     * Generate solution data including vertices and regions
     *
     * @return array Solution data
     */
    public function solve() {
        $vertices = $this->findVertices();

        // Generate sample points for energy visualization
        $gridResolution = 20;
        $xStep = ($this->bounds['xMax'] - $this->bounds['xMin']) / $gridResolution;
        $yStep = ($this->bounds['yMax'] - $this->bounds['yMin']) / $gridResolution;

        $energyMap = [];
        for ($i = 0; $i <= $gridResolution; $i++) {
            for ($j = 0; $j <= $gridResolution; $j++) {
                $x = $this->bounds['xMin'] + $i * $xStep;
                $y = $this->bounds['yMin'] + $j * $yStep;
                $intensity = $this->calculateEnergyIntensity($x, $y);

                if ($intensity > 0) {
                    $energyMap[] = [
                        'x' => round($x, 2),
                        'y' => round($y, 2),
                        'intensity' => round($intensity, 3)
                    ];
                }
            }
        }

        return [
            'vertices' => $vertices,
            'energyMap' => $energyMap,
            'bounds' => $this->bounds,
            'inequalityCount' => count($this->inequalities)
        ];
    }
}
