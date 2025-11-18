<?php
/**
 * Artwork Generator Script
 * Generates remaining artworks (21-100) programmatically
 */

require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/config/database.php';

class ArtworkGenerator {
    private $db;
    private $colorSchemes = [
        'warm' => ['#FF6B6B', '#FFE66D', '#FF9A76'],
        'cool' => ['#4ECDC4', '#74B9FF', '#A29BFE'],
        'pastel' => ['#95E1D3', '#F38181', '#EAFFD0'],
        'vibrant' => ['#FD79A8', '#FDCB6E', '#00B894'],
        'nature' => ['#A8E6CF', '#DCEDC1', '#FFD3B6'],
        'ocean' => ['#0984E3', #6C5CE7', '#00CEC9']
    ];

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Generate SVG for a number
     */
    public function generateSVG($number) {
        $scheme = array_rand($this->colorSchemes);
        $colors = $this->colorSchemes[$scheme];

        // Different patterns based on number properties
        if ($number % 10 === 0) {
            return $this->generateCirclePattern($number, $colors);
        } elseif ($this->isPrime($number)) {
            return $this->generateStarPattern($number, $colors);
        } elseif ($number % 5 === 0) {
            return $this->generateGridPattern($number, $colors);
        } else {
            return $this->generateGeometricPattern($number, $colors);
        }
    }

    /**
     * Generate circle pattern
     */
    private function generateCirclePattern($number, $colors) {
        $circles = '';
        $count = min($number / 10, 10);
        $color = $colors[0];

        for ($i = 0; $i < $count; $i++) {
            $angle = ($i / $count) * 2 * M_PI;
            $cx = 50 + cos($angle) * 30;
            $cy = 50 + sin($angle) * 30;
            $r = 8 + ($i % 3) * 2;
            $circles .= sprintf('<circle cx="%.1f" cy="%.1f" r="%d" fill="%s" opacity="0.8"/>', $cx, $cy, $r, $color);
        }

        return sprintf('<svg viewBox="0 0 100 100"><g>%s</g></svg>', $circles);
    }

    /**
     * Generate star pattern
     */
    private function generateStarPattern($number, $colors) {
        $color = $colors[array_rand($colors)];
        $points = $this->generateStarPoints(50, 50, min($number % 20 + 5, 15), 35, 15);

        return sprintf(
            '<svg viewBox="0 0 100 100"><polygon points="%s" fill="%s"/></svg>',
            $points,
            $color
        );
    }

    /**
     * Generate grid pattern
     */
    private function generateGridPattern($number, $colors) {
        $rects = '';
        $rows = min(ceil(sqrt($number / 5)), 6);
        $cols = $rows;
        $size = 80 / max($rows, $cols);
        $margin = (100 - $size * $cols) / 2;

        for ($i = 0; $i < $rows; $i++) {
            for ($j = 0; $j < $cols; $j++) {
                if ($i * $cols + $j < $number / 5) {
                    $x = $margin + $j * $size;
                    $y = $margin + $i * $size;
                    $color = $colors[($i + $j) % count($colors)];
                    $rects .= sprintf(
                        '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" rx="2" opacity="0.85"/>',
                        $x, $y, $size * 0.85, $size * 0.85, $color
                    );
                }
            }
        }

        return sprintf('<svg viewBox="0 0 100 100"><g>%s</g></svg>', $rects);
    }

    /**
     * Generate geometric pattern
     */
    private function generateGeometricPattern($number, $colors) {
        $shapes = '';
        $numShapes = min($number % 10 + 3, 12);
        $color = $colors[0];

        for ($i = 0; $i < $numShapes; $i++) {
            $angle = ($i / $numShapes) * 2 * M_PI;
            $cx = 50 + cos($angle) * 25;
            $cy = 50 + sin($angle) * 25;
            $size = 8 + ($number % 5);

            if ($i % 2 === 0) {
                $shapes .= sprintf(
                    '<circle cx="%.1f" cy="%.1f" r="%d" fill="%s" opacity="0.7"/>',
                    $cx, $cy, $size, $color
                );
            } else {
                $shapes .= sprintf(
                    '<rect x="%.1f" y="%.1f" width="%d" height="%d" fill="%s" opacity="0.7" rx="2"/>',
                    $cx - $size/2, $cy - $size/2, $size, $size, $color
                );
            }
        }

        return sprintf('<svg viewBox="0 0 100 100"><g>%s</g></svg>', $shapes);
    }

    /**
     * Generate star points
     */
    private function generateStarPoints($cx, $cy, $spikes, $outerR, $innerR) {
        $points = [];
        $step = M_PI / $spikes;

        for ($i = 0; $i < 2 * $spikes; $i++) {
            $r = ($i % 2 === 0) ? $outerR : $innerR;
            $angle = $i * $step - M_PI / 2;
            $x = $cx + cos($angle) * $r;
            $y = $cy + sin($angle) * $r;
            $points[] = sprintf('%.1f,%.1f', $x, $y);
        }

        return implode(' ', $points);
    }

    /**
     * Check if number is prime
     */
    private function isPrime($n) {
        if ($n < 2) return false;
        if ($n === 2) return true;
        if ($n % 2 === 0) return false;

        for ($i = 3; $i <= sqrt($n); $i += 2) {
            if ($n % $i === 0) return false;
        }

        return true;
    }

    /**
     * Generate and insert all artworks
     */
    public function generateAll() {
        echo "Generating artworks for numbers 1-100...\n\n";

        for ($number = 1; $number <= 100; $number++) {
            // Check if artwork already exists
            $exists = $this->db->fetchOne(
                "SELECT id FROM artworks WHERE number = ?",
                [$number]
            );

            if ($exists) {
                echo "Artwork #{$number} already exists, skipping...\n";
                continue;
            }

            $svg = $this->generateSVG($number);
            $title = $this->generateTitle($number);
            $description = $this->generateDescription($number);
            $scheme = array_rand($this->colorSchemes);
            $difficulty = $this->calculateDifficulty($number);

            $sql = "INSERT INTO artworks (number, title, description, svg_data, color_scheme, difficulty_level)
                    VALUES (?, ?, ?, ?, ?, ?)";

            $id = $this->db->insert($sql, [
                $number,
                $title,
                $description,
                $svg,
                $scheme,
                $difficulty
            ]);

            if ($id) {
                echo "✓ Generated artwork #{$number}: {$title}\n";
            } else {
                echo "✗ Failed to generate artwork #{$number}\n";
            }
        }

        echo "\nArtwork generation completed!\n";
    }

    /**
     * Generate title for number
     */
    private function generateTitle($number) {
        $titles = [
            10 => 'Ten - 십',
            20 => 'Twenty - 이십',
            30 => 'Thirty - 삼십',
            40 => 'Forty - 사십',
            50 => 'Fifty - 오십',
            60 => 'Sixty - 육십',
            70 => 'Seventy - 칠십',
            80 => 'Eighty - 팔십',
            90 => 'Ninety - 구십',
            100 => 'Hundred - 백'
        ];

        return $titles[$number] ?? "Number {$number}";
    }

    /**
     * Generate description
     */
    private function generateDescription($number) {
        if ($this->isPrime($number)) {
            return "소수 {$number}의 독특한 패턴";
        } elseif ($number % 10 === 0) {
            return "{$number}의 조화로운 구조";
        } else {
            return "{$number}을 표현한 창의적인 아트워크";
        }
    }

    /**
     * Calculate difficulty based on number
     */
    private function calculateDifficulty($number) {
        if ($number <= 10) return 1;
        if ($number <= 30) return 2;
        if ($number <= 50) return 3;
        if ($number <= 75) return 4;
        return 5;
    }
}

// Run generator
if (php_sapi_name() === 'cli') {
    try {
        $generator = new ArtworkGenerator();
        $generator->generateAll();
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}
