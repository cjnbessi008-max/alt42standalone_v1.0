<?php
/**
 * Outlier Detection Algorithm
 * Identifies statistical outliers in student performance data
 * Uses IQR (Interquartile Range) and Z-score methods
 */

class OutlierDetector {

    /**
     * Detect outliers using IQR method
     * @param array $data Array of numeric values
     * @param float $threshold IQR multiplier (default 1.5)
     * @return array Array with outlier information
     */
    public function detectOutliersIQR($data, $threshold = 1.5) {
        if (empty($data)) {
            return ['outliers' => [], 'lower_bound' => null, 'upper_bound' => null];
        }

        $values = array_column($data, 'value');
        sort($values);

        $q1 = $this->calculatePercentile($values, 25);
        $q3 = $this->calculatePercentile($values, 75);
        $iqr = $q3 - $q1;

        $lowerBound = $q1 - ($threshold * $iqr);
        $upperBound = $q3 + ($threshold * $iqr);

        $outliers = [];
        foreach ($data as $item) {
            $value = $item['value'];
            if ($value < $lowerBound || $value > $upperBound) {
                $severity = $this->calculateSeverity($value, $lowerBound, $upperBound, $iqr);
                $outliers[] = array_merge($item, [
                    'outlier_type' => $value < $lowerBound ? 'low' : 'high',
                    'severity' => $severity,
                    'shadow_intensity' => $this->calculateShadowIntensity($severity)
                ]);
            }
        }

        return [
            'outliers' => $outliers,
            'lower_bound' => $lowerBound,
            'upper_bound' => $upperBound,
            'q1' => $q1,
            'q3' => $q3,
            'iqr' => $iqr,
            'median' => $this->calculatePercentile($values, 50)
        ];
    }

    /**
     * Detect outliers using Z-score method
     * @param array $data Array of numeric values
     * @param float $threshold Z-score threshold (default 2.5)
     * @return array Array with outlier information
     */
    public function detectOutliersZScore($data, $threshold = 2.5) {
        if (empty($data)) {
            return ['outliers' => [], 'mean' => null, 'stddev' => null];
        }

        $values = array_column($data, 'value');
        $mean = array_sum($values) / count($values);
        $stddev = $this->calculateStdDev($values, $mean);

        if ($stddev == 0) {
            return ['outliers' => [], 'mean' => $mean, 'stddev' => $stddev];
        }

        $outliers = [];
        foreach ($data as $item) {
            $value = $item['value'];
            $zscore = abs(($value - $mean) / $stddev);

            if ($zscore > $threshold) {
                $severity = min($zscore / 5, 1); // Normalize to 0-1
                $outliers[] = array_merge($item, [
                    'outlier_type' => $value < $mean ? 'low' : 'high',
                    'zscore' => $zscore,
                    'severity' => $severity,
                    'shadow_intensity' => $this->calculateShadowIntensity($severity)
                ]);
            }
        }

        return [
            'outliers' => $outliers,
            'mean' => $mean,
            'stddev' => $stddev
        ];
    }

    /**
     * Detect outliers in student performance data
     * @param array $students Student performance data
     * @param string $method Detection method ('iqr' or 'zscore')
     * @return array Processed data with outlier flags
     */
    public function detectStudentOutliers($students, $method = 'iqr') {
        // Prepare data for outlier detection
        $preparedData = [];
        foreach ($students as $student) {
            $preparedData[] = [
                'value' => floatval($student['avg_score'] ?? $student['score'] ?? 0),
                'student' => $student
            ];
        }

        // Detect outliers using specified method
        if ($method === 'zscore') {
            $result = $this->detectOutliersZScore($preparedData);
        } else {
            $result = $this->detectOutliersIQR($preparedData);
        }

        // Mark all students with outlier information
        $outlierIds = array_column($result['outliers'], 'student');
        $outlierMap = [];
        foreach ($result['outliers'] as $outlier) {
            $studentId = $outlier['student']['userid'] ?? $outlier['student']['id'];
            $outlierMap[$studentId] = $outlier;
        }

        $processedStudents = [];
        foreach ($students as $student) {
            $studentId = $student['userid'] ?? $student['id'];
            $student['is_outlier'] = isset($outlierMap[$studentId]);

            if ($student['is_outlier']) {
                $student['outlier_info'] = [
                    'type' => $outlierMap[$studentId]['outlier_type'],
                    'severity' => $outlierMap[$studentId]['severity'],
                    'shadow_intensity' => $outlierMap[$studentId]['shadow_intensity']
                ];
            } else {
                $student['outlier_info'] = null;
            }

            $processedStudents[] = $student;
        }

        return [
            'students' => $processedStudents,
            'statistics' => $result,
            'outlier_count' => count($result['outliers'])
        ];
    }

    /**
     * Calculate percentile value
     * @param array $values Sorted array of values
     * @param float $percentile Percentile (0-100)
     * @return float Percentile value
     */
    private function calculatePercentile($values, $percentile) {
        $count = count($values);
        if ($count === 0) return 0;

        $index = ($percentile / 100) * ($count - 1);
        $lower = floor($index);
        $upper = ceil($index);

        if ($lower === $upper) {
            return $values[$lower];
        }

        $weight = $index - $lower;
        return $values[$lower] * (1 - $weight) + $values[$upper] * $weight;
    }

    /**
     * Calculate standard deviation
     * @param array $values Array of values
     * @param float $mean Mean value
     * @return float Standard deviation
     */
    private function calculateStdDev($values, $mean) {
        $variance = 0;
        foreach ($values as $value) {
            $variance += pow($value - $mean, 2);
        }
        return sqrt($variance / count($values));
    }

    /**
     * Calculate outlier severity (0-1)
     * @param float $value The outlier value
     * @param float $lowerBound Lower boundary
     * @param float $upperBound Upper boundary
     * @param float $iqr Interquartile range
     * @return float Severity score (0-1)
     */
    private function calculateSeverity($value, $lowerBound, $upperBound, $iqr) {
        if ($value < $lowerBound) {
            $distance = $lowerBound - $value;
        } else {
            $distance = $value - $upperBound;
        }

        // Normalize severity: 0 at boundary, 1 at 3*IQR distance
        $severity = min($distance / (3 * $iqr), 1);
        return $severity;
    }

    /**
     * Calculate shadow intensity based on severity
     * @param float $severity Severity score (0-1)
     * @return float Shadow intensity (0-1)
     */
    private function calculateShadowIntensity($severity) {
        // Map severity to shadow intensity
        // Mild outliers: 0.3-0.5 intensity
        // Moderate outliers: 0.5-0.7 intensity
        // Severe outliers: 0.7-0.9 intensity
        return 0.3 + ($severity * 0.6);
    }

    /**
     * Get shadow color based on outlier type and intensity
     * @param string $type Outlier type ('low' or 'high')
     * @param float $intensity Shadow intensity (0-1)
     * @return string RGBA color string
     */
    public function getShadowColor($type, $intensity) {
        // Low performers: red tint shadow
        // High performers: blue tint shadow
        if ($type === 'low') {
            $alpha = 0.5 + ($intensity * 0.4); // 0.5 to 0.9
            return "rgba(139, 0, 0, {$alpha})"; // Dark red
        } else {
            $alpha = 0.4 + ($intensity * 0.3); // 0.4 to 0.7
            return "rgba(0, 0, 139, {$alpha})"; // Dark blue
        }
    }

    /**
     * Get shadow style CSS for visualization
     * @param array $outlierInfo Outlier information
     * @return string CSS box-shadow value
     */
    public function getShadowStyle($outlierInfo) {
        if (!$outlierInfo) {
            return 'none';
        }

        $intensity = $outlierInfo['shadow_intensity'];
        $color = $this->getShadowColor($outlierInfo['type'], $intensity);

        // Create multiple shadow layers for depth effect
        $blur = 15 + ($intensity * 35); // 15px to 50px blur
        $spread = 5 + ($intensity * 15); // 5px to 20px spread

        return "0 0 {$blur}px {$spread}px {$color}";
    }
}
