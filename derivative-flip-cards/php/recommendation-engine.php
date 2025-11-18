<?php
/**
 * Recommendation Engine for Derivative Flip Cards
 *
 * Provides personalized card recommendations based on:
 * - Student learning progress
 * - Card difficulty levels
 * - Learning patterns and history
 * - Time since last view
 */

require_once __DIR__ . '/../config/database.php';

/**
 * Get recommended next card for a student
 *
 * @param int $studentId Student ID
 * @param int $courseId Course ID
 * @return array Recommendation with card and reasoning
 */
function getRecommendedCard($studentId, $courseId = 0) {
    try {
        // Get all cards
        $cards = getAllCards($courseId);

        // Get student learning history
        $history = getStudentHistory($studentId);

        // Calculate recommendation scores
        $scoredCards = [];
        foreach ($cards as $card) {
            $score = calculateRecommendationScore($card, $history, $studentId);
            $scoredCards[] = array_merge($card, [
                'recommendation_score' => $score['total'],
                'recommendation_reasons' => $score['reasons']
            ]);
        }

        // Sort by score (highest first)
        usort($scoredCards, function($a, $b) {
            return $b['recommendation_score'] <=> $a['recommendation_score'];
        });

        // Return top recommendation
        return [
            'success' => true,
            'recommendation' => $scoredCards[0],
            'alternatives' => array_slice($scoredCards, 1, 3) // Top 3 alternatives
        ];

    } catch (Exception $e) {
        error_log('Error in getRecommendedCard: ' . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to generate recommendation'
        ];
    }
}

/**
 * Calculate recommendation score for a card
 *
 * @param array $card Card data
 * @param array $history Student learning history
 * @param int $studentId Student ID
 * @return array Score breakdown
 */
function calculateRecommendationScore($card, $history, $studentId) {
    $score = 0;
    $reasons = [];

    $cardId = $card['id'];
    $difficulty = isset($card['difficulty']) ? intval($card['difficulty']) : 2;

    // Check if card has been viewed
    $viewed = isset($history['viewed'][$cardId]);
    $viewCount = isset($history['view_count'][$cardId]) ? $history['view_count'][$cardId] : 0;
    $flipCount = isset($history['flip_count'][$cardId]) ? $history['flip_count'][$cardId] : 0;
    $lastViewed = isset($history['last_viewed'][$cardId]) ? $history['last_viewed'][$cardId] : null;

    // 1. Never viewed cards get highest priority
    if (!$viewed) {
        $score += 100;
        $reasons[] = '아직 학습하지 않은 새로운 카드입니다';
    }

    // 2. Difficulty progression (prefer cards matching student level)
    $studentLevel = estimateStudentLevel($history);
    if ($difficulty <= $studentLevel + 1) {
        $diffScore = 50 - abs($difficulty - $studentLevel) * 10;
        $score += $diffScore;
        if ($difficulty == $studentLevel) {
            $reasons[] = '현재 학습 수준에 적합한 난이도입니다';
        } elseif ($difficulty == $studentLevel + 1) {
            $reasons[] = '다음 단계로 나아갈 준비가 되었습니다';
        }
    }

    // 3. Time since last view (spaced repetition)
    if ($lastViewed) {
        $hoursSinceView = (time() - strtotime($lastViewed)) / 3600;

        // Optimal review times: 1 hour, 1 day, 1 week
        if ($hoursSinceView > 168) { // 1 week
            $score += 40;
            $reasons[] = '복습이 필요한 시기입니다 (1주일 경과)';
        } elseif ($hoursSinceView > 24) { // 1 day
            $score += 30;
            $reasons[] = '복습하면 좋을 시기입니다 (1일 경과)';
        } elseif ($hoursSinceView > 1) { // 1 hour
            $score += 20;
            $reasons[] = '단기 복습 시간입니다';
        } else {
            $score -= 20; // Recently viewed, lower priority
        }
    }

    // 4. Low engagement (viewed but not flipped much)
    if ($viewed && $viewCount > 0) {
        $flipRatio = $flipCount / $viewCount;
        if ($flipRatio < 0.5) {
            $score += 25;
            $reasons[] = '더 깊이 학습하면 좋은 카드입니다';
        }

        // Cards viewed rarely
        if ($viewCount < 3) {
            $score += 15;
            $reasons[] = '충분히 학습하지 않은 카드입니다';
        }
    }

    // 5. Sequential learning preference (for beginners)
    if (count($history['viewed']) < 5) {
        // Encourage sequential learning for beginners
        $expectedNext = count($history['viewed']) + 1;
        if ($card['display_order'] == $expectedNext) {
            $score += 30;
            $reasons[] = '순차적 학습에 적합한 다음 카드입니다';
        }
    }

    // 6. Avoid recently viewed cards
    if ($lastViewed) {
        $minutesSinceView = (time() - strtotime($lastViewed)) / 60;
        if ($minutesSinceView < 5) {
            $score -= 50; // Heavy penalty for very recent views
        }
    }

    // 7. Category diversity (prefer different categories)
    $lastCategory = getLastViewedCategory($studentId);
    if ($lastCategory && isset($card['category']) && $card['category'] != $lastCategory) {
        $score += 10;
        $reasons[] = '다양한 유형의 학습을 위해 추천합니다';
    }

    return [
        'total' => max(0, $score), // Ensure non-negative
        'reasons' => $reasons
    ];
}

/**
 * Estimate student's current learning level
 *
 * @param array $history Student learning history
 * @return int Estimated level (1-3)
 */
function estimateStudentLevel($history) {
    $viewedCards = count($history['viewed']);

    if ($viewedCards == 0) {
        return 1; // Beginner
    } elseif ($viewedCards < 6) {
        return 1; // Still basic level
    } elseif ($viewedCards < 10) {
        return 2; // Intermediate
    } else {
        return 3; // Advanced
    }
}

/**
 * Get all cards with difficulty info
 *
 * @param int $courseId Course ID
 * @return array Cards array
 */
function getAllCards($courseId = 0) {
    try {
        $tableExists = checkTableExists(TABLE_DERIVATIVE_CARDS);

        if ($tableExists) {
            $sql = "SELECT
                        id,
                        rule_name,
                        formula,
                        example,
                        description,
                        display_order
                    FROM " . TABLE_DERIVATIVE_CARDS . "
                    WHERE active = 1";

            if ($courseId > 0) {
                $sql .= " AND (course_id = :course_id OR course_id IS NULL)";
                $cards = fetchAll($sql, ['course_id' => $courseId]);
            } else {
                $sql .= " ORDER BY display_order ASC";
                $cards = fetchAll($sql);
            }

            // Add difficulty from default data
            $difficulties = [
                1 => 1, 2 => 1, 3 => 1, 4 => 1, 5 => 1,  // Basic
                6 => 2, 7 => 2, 9 => 2, 10 => 2, 11 => 2, 12 => 2,  // Intermediate
                8 => 3  // Advanced (Chain Rule)
            ];

            $categories = [
                1 => 'basic', 2 => 'basic', 3 => 'basic', 4 => 'basic', 5 => 'basic',
                6 => 'intermediate', 7 => 'intermediate',
                8 => 'advanced',
                9 => 'transcendental', 10 => 'transcendental',
                11 => 'trigonometric', 12 => 'trigonometric'
            ];

            foreach ($cards as &$card) {
                $card['difficulty'] = isset($difficulties[$card['id']]) ? $difficulties[$card['id']] : 2;
                $card['category'] = isset($categories[$card['id']]) ? $categories[$card['id']] : 'basic';
            }

            return $cards;
        }

        return [];

    } catch (Exception $e) {
        error_log('Error in getAllCards: ' . $e->getMessage());
        return [];
    }
}

/**
 * Get student's learning history
 *
 * @param int $studentId Student ID
 * @return array History data
 */
function getStudentHistory($studentId) {
    try {
        $tableExists = checkTableExists(TABLE_CARD_EVENTS);

        if (!$tableExists) {
            return [
                'viewed' => [],
                'view_count' => [],
                'flip_count' => [],
                'last_viewed' => []
            ];
        }

        // Get all events for this student
        $sql = "SELECT
                    card_id,
                    event_type,
                    MAX(event_timestamp) as last_time,
                    COUNT(*) as count
                FROM " . TABLE_CARD_EVENTS . "
                WHERE student_id = :student_id
                GROUP BY card_id, event_type";

        $events = fetchAll($sql, ['student_id' => $studentId]);

        $history = [
            'viewed' => [],
            'view_count' => [],
            'flip_count' => [],
            'last_viewed' => []
        ];

        foreach ($events as $event) {
            $cardId = $event['card_id'];

            if ($event['event_type'] == 'view') {
                $history['viewed'][$cardId] = true;
                $history['view_count'][$cardId] = $event['count'];
                $history['last_viewed'][$cardId] = $event['last_time'];
            } elseif ($event['event_type'] == 'flip') {
                $history['flip_count'][$cardId] = $event['count'];
            }
        }

        return $history;

    } catch (Exception $e) {
        error_log('Error in getStudentHistory: ' . $e->getMessage());
        return [
            'viewed' => [],
            'view_count' => [],
            'flip_count' => [],
            'last_viewed' => []
        ];
    }
}

/**
 * Get the category of the last viewed card
 *
 * @param int $studentId Student ID
 * @return string|null Category name
 */
function getLastViewedCategory($studentId) {
    try {
        $tableExists = checkTableExists(TABLE_CARD_EVENTS);

        if (!$tableExists) {
            return null;
        }

        $sql = "SELECT c.id, c.display_order
                FROM " . TABLE_CARD_EVENTS . " e
                INNER JOIN " . TABLE_DERIVATIVE_CARDS . " c ON e.card_id = c.id
                WHERE e.student_id = :student_id
                AND e.event_type = 'view'
                ORDER BY e.event_timestamp DESC
                LIMIT 1";

        $result = fetchOne($sql, ['student_id' => $studentId]);

        if ($result) {
            $categories = [
                1 => 'basic', 2 => 'basic', 3 => 'basic', 4 => 'basic', 5 => 'basic',
                6 => 'intermediate', 7 => 'intermediate',
                8 => 'advanced',
                9 => 'transcendental', 10 => 'transcendental',
                11 => 'trigonometric', 12 => 'trigonometric'
            ];

            return isset($categories[$result['id']]) ? $categories[$result['id']] : null;
        }

        return null;

    } catch (Exception $e) {
        error_log('Error in getLastViewedCategory: ' . $e->getMessage());
        return null;
    }
}

/**
 * Get learning path recommendations (sequence of cards)
 *
 * @param int $studentId Student ID
 * @param int $courseId Course ID
 * @param int $count Number of cards to recommend
 * @return array Recommended learning path
 */
function getLearningPath($studentId, $courseId = 0, $count = 5) {
    try {
        $cards = getAllCards($courseId);
        $history = getStudentHistory($studentId);

        $path = [];
        $usedCards = [];

        // Generate sequence of recommendations
        for ($i = 0; $i < $count; $i++) {
            $scoredCards = [];

            foreach ($cards as $card) {
                // Skip already used cards in this path
                if (in_array($card['id'], $usedCards)) {
                    continue;
                }

                $score = calculateRecommendationScore($card, $history, $studentId);
                $scoredCards[] = array_merge($card, [
                    'recommendation_score' => $score['total']
                ]);
            }

            if (empty($scoredCards)) {
                break;
            }

            // Sort and get best card
            usort($scoredCards, function($a, $b) {
                return $b['recommendation_score'] <=> $a['recommendation_score'];
            });

            $bestCard = $scoredCards[0];
            $path[] = $bestCard;
            $usedCards[] = $bestCard['id'];

            // Simulate that this card was viewed for next iteration
            $history['viewed'][$bestCard['id']] = true;
        }

        return [
            'success' => true,
            'path' => $path,
            'total_cards' => count($cards)
        ];

    } catch (Exception $e) {
        error_log('Error in getLearningPath: ' . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Failed to generate learning path'
        ];
    }
}
?>
