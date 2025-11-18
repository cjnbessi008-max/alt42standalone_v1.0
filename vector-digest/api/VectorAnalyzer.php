<?php
/**
 * Vector Analyzer
 * Analyzes text for vector concepts and generates 3-line summaries
 */

class VectorAnalyzer {

    private $keywords;
    private $concept_templates;

    public function __construct($keywords = []) {
        $this->keywords = $keywords;
        $this->init_templates();
    }

    /**
     * Initialize concept templates for summary generation
     */
    private function init_templates() {
        $this->concept_templates = [
            'basics' => [
                'ko' => [
                    '벡터는 크기와 방향을 모두 가진 물리량입니다.',
                    '벡터는 화살표로 표현되며, 길이는 크기를, 방향은 화살표 방향을 나타냅니다.',
                    '스칼라는 크기만 있지만, 벡터는 방향 정보도 포함합니다.'
                ],
                'en' => [
                    'A vector is a quantity with both magnitude and direction.',
                    'Vectors are represented by arrows where length shows magnitude.',
                    'Unlike scalars (magnitude only), vectors include directional information.'
                ]
            ],
            'addition' => [
                'ko' => [
                    '벡터의 덧셈은 평행사변형 법칙으로 수행됩니다.',
                    '두 벡터를 연결하여 머리와 꼬리를 이으면 합벡터를 얻습니다.',
                    '성분별 덧셈: (a₁,b₁) + (a₂,b₂) = (a₁+a₂, b₁+b₂)'
                ],
                'en' => [
                    'Vector addition follows the parallelogram law.',
                    'Connect vectors head-to-tail to find the resultant vector.',
                    'Component-wise: (a₁,b₁) + (a₂,b₂) = (a₁+a₂, b₁+b₂)'
                ]
            ],
            'products' => [
                'ko' => [
                    '내적(dot product)은 두 벡터의 스칼라 곱으로 스칼라 결과를 생성합니다.',
                    '외적(cross product)은 두 벡터에 수직인 새로운 벡터를 생성합니다.',
                    '내적 공식: a·b = |a||b|cosθ, 외적: |a×b| = |a||b|sinθ'
                ],
                'en' => [
                    'Dot product produces a scalar: a·b = |a||b|cosθ',
                    'Cross product creates a perpendicular vector: |a×b| = |a||b|sinθ',
                    'Dot product measures projection; cross product measures area.'
                ]
            ],
            'components' => [
                'ko' => [
                    '벡터는 x, y, z 성분으로 분해할 수 있습니다.',
                    '단위 벡터(i, j, k)를 사용하여 v = ai + bj + ck로 표현합니다.',
                    '벡터의 크기: |v| = √(a² + b² + c²)'
                ],
                'en' => [
                    'Vectors decompose into x, y, z components.',
                    'Express using unit vectors: v = ai + bj + ck',
                    'Magnitude formula: |v| = √(a² + b² + c²)'
                ]
            ],
            'applications' => [
                'ko' => [
                    '벡터는 물리학에서 변위, 속도, 가속도, 힘을 표현합니다.',
                    '여러 힘의 합력은 벡터 덧셈으로 구합니다.',
                    '속도 벡터는 방향과 속력을 동시에 나타냅니다.'
                ],
                'en' => [
                    'Vectors represent displacement, velocity, acceleration, and force.',
                    'Resultant force is found through vector addition.',
                    'Velocity vectors show both speed and direction.'
                ]
            ],
            'unit_vectors' => [
                'ko' => [
                    '단위 벡터는 크기가 1인 벡터입니다.',
                    '임의의 벡터 v에서 단위 벡터: û = v/|v|',
                    '기본 단위 벡터 i, j, k는 x, y, z축 방향을 나타냅니다.'
                ],
                'en' => [
                    'Unit vectors have magnitude of 1.',
                    'For any vector v, unit vector: û = v/|v|',
                    'Standard unit vectors i, j, k represent x, y, z axes.'
                ]
            ]
        ];
    }

    /**
     * Analyze text for vector content
     */
    public function analyze($text) {
        $text_lower = mb_strtolower($text, 'UTF-8');
        $found_keywords = [];
        $concepts = [];

        // Detect keywords
        foreach ($this->keywords as $keyword) {
            if (mb_strpos($text_lower, mb_strtolower($keyword, 'UTF-8')) !== false) {
                $found_keywords[] = $keyword;
            }
        }

        // Determine concepts
        $concepts = $this->identify_concepts($found_keywords, $text_lower);

        // Calculate confidence
        $confidence = min(1.0, count($found_keywords) * 0.15);

        // Detect language
        $language = $this->detect_language($text);

        return [
            'has_vector_content' => count($found_keywords) > 0,
            'keywords' => $found_keywords,
            'concepts' => $concepts,
            'confidence' => round($confidence, 2),
            'language' => $language
        ];
    }

    /**
     * Identify main vector concepts from keywords and text
     */
    private function identify_concepts($keywords, $text) {
        $concepts = [];

        // Basic vector concepts
        $basic_terms = ['vector', 'vectors', 'magnitude', 'direction', '벡터', '크기', '방향'];
        if ($this->has_any($keywords, $basic_terms)) {
            $concepts[] = 'basics';
        }

        // Addition/subtraction
        $addition_terms = ['addition', 'add', 'sum', 'resultant', 'parallelogram', 'triangle', '덧셈', '합', '평행사변형', '삼각형'];
        if ($this->has_any($keywords, $addition_terms) || preg_match('/\+|\-|더하|빼/', $text)) {
            $concepts[] = 'addition';
        }

        // Products
        $product_terms = ['dot product', 'cross product', 'scalar product', 'vector product', '내적', '외적'];
        if ($this->has_any($keywords, $product_terms)) {
            $concepts[] = 'products';
        }

        // Components
        $component_terms = ['component', 'components', 'basis', 'coordinate', '성분', '좌표'];
        if ($this->has_any($keywords, $component_terms) || preg_match('/[xyz]축|i\s*j\s*k/', $text)) {
            $concepts[] = 'components';
        }

        // Unit vectors
        $unit_terms = ['unit vector', 'normalize', 'normalization', '단위벡터', '정규화'];
        if ($this->has_any($keywords, $unit_terms)) {
            $concepts[] = 'unit_vectors';
        }

        // Applications
        $app_terms = ['force', 'velocity', 'acceleration', 'displacement', '힘', '속도', '가속도', '변위'];
        if ($this->has_any($keywords, $app_terms)) {
            $concepts[] = 'applications';
        }

        // Default to basics if nothing specific found
        if (empty($concepts) && !empty($keywords)) {
            $concepts[] = 'basics';
        }

        return $concepts;
    }

    /**
     * Check if any terms exist in keywords
     */
    private function has_any($keywords, $terms) {
        foreach ($terms as $term) {
            foreach ($keywords as $keyword) {
                if (stripos($keyword, $term) !== false || stripos($term, $keyword) !== false) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Detect language (ko or en)
     */
    private function detect_language($text) {
        // Simple detection: check for Korean characters
        if (preg_match('/[\x{AC00}-\x{D7AF}\x{1100}-\x{11FF}\x{3130}-\x{318F}]/u', $text)) {
            return 'ko';
        }
        return 'en';
    }

    /**
     * Generate 3-line summary based on analysis
     */
    public function generate_summary($text, $analysis) {
        $language = $analysis['language'];
        $concepts = $analysis['concepts'];

        // Select primary concept
        $primary_concept = !empty($concepts) ? $concepts[0] : 'basics';

        // Get template lines
        $lines = $this->concept_templates[$primary_concept][$language] ??
                 $this->concept_templates['basics'][$language];

        // If multiple concepts, try to blend them
        if (count($concepts) > 1) {
            $lines = $this->blend_concepts($concepts, $language);
        }

        return [
            'line1' => $lines[0],
            'line2' => $lines[1],
            'line3' => $lines[2],
            'language' => $language
        ];
    }

    /**
     * Blend multiple concepts into 3 lines
     */
    private function blend_concepts($concepts, $language) {
        $all_lines = [];

        foreach ($concepts as $concept) {
            if (isset($this->concept_templates[$concept][$language])) {
                $all_lines = array_merge($all_lines, $this->concept_templates[$concept][$language]);
            }
        }

        // Pick 3 most relevant lines
        $selected = [];
        $indices = [0, count($all_lines) > 3 ? intval(count($all_lines) / 2) : 1, count($all_lines) - 1];

        foreach ($indices as $idx) {
            if (isset($all_lines[$idx])) {
                $selected[] = $all_lines[$idx];
            }
        }

        // Fill with basics if needed
        while (count($selected) < 3) {
            $selected[] = $this->concept_templates['basics'][$language][count($selected) % 3];
        }

        return array_slice($selected, 0, 3);
    }

    /**
     * Extract vector-related sentences from text (alternative approach)
     */
    public function extract_key_sentences($text, $max = 3) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Split into sentences
        $sentences = preg_split('/[.!?。！?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);

        // Score sentences by keyword presence
        $scored = [];
        foreach ($sentences as $sentence) {
            $score = 0;
            $sentence_lower = mb_strtolower(trim($sentence), 'UTF-8');

            foreach ($this->keywords as $keyword) {
                if (mb_strpos($sentence_lower, mb_strtolower($keyword, 'UTF-8')) !== false) {
                    $score++;
                }
            }

            if ($score > 0 && mb_strlen($sentence) < VD_MAX_SUMMARY_LENGTH) {
                $scored[] = ['sentence' => trim($sentence), 'score' => $score];
            }
        }

        // Sort by score
        usort($scored, function($a, $b) {
            return $b['score'] - $a['score'];
        });

        // Get top N
        $result = array_slice($scored, 0, $max);

        return array_map(function($item) {
            return $item['sentence'];
        }, $result);
    }
}
