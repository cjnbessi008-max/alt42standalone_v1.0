<?php
/**
 * Filter Shrink Engine
 *
 * 조건이 순차적으로 적용되면서 문제 수가 점진적으로 줄어드는 필터링 시스템
 *
 * Flow:
 * 1. 초기 문제 세트 로드
 * 2. 각 필터를 순차적으로 적용
 * 3. 각 단계에서 남은 문제 수 계산
 * 4. 최종 문제 선택
 */

require_once __DIR__ . '/../../utils/Database.php';

class FilterEngine {
    private $db;
    private $sessionId;
    private $studentId;
    private $appliedFilters = [];
    private $currentProblems = [];

    public function __construct($studentId = null) {
        $this->db = Database::getInstance();
        $this->studentId = $studentId;
    }

    /**
     * Start new filter session
     */
    public function startSession($studentId) {
        $this->studentId = $studentId;
        $sessionToken = bin2hex(random_bytes(32));

        // Create session
        $this->sessionId = $this->db->insert(
            "INSERT INTO filter_sessions
            (student_id, session_token, applied_filters, started_at, expires_at)
            VALUES (?, ?, '[]', NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR))",
            [$studentId, $sessionToken]
        );

        // Get initial problem count
        $initialCount = $this->getAvailableProblemCount();

        $this->db->query(
            "UPDATE filter_sessions SET remaining_count = ? WHERE id = ?",
            [$initialCount, $this->sessionId]
        );

        return [
            'session_id' => $this->sessionId,
            'session_token' => $sessionToken,
            'initial_count' => $initialCount,
            'available_filters' => $this->getAvailableFilters()
        ];
    }

    /**
     * Load existing session
     */
    public function loadSession($sessionToken) {
        $session = $this->db->fetchOne(
            "SELECT * FROM filter_sessions
            WHERE session_token = ? AND expires_at > NOW() AND is_completed = FALSE",
            [$sessionToken]
        );

        if (!$session) {
            throw new Exception("Session not found or expired");
        }

        $this->sessionId = $session['id'];
        $this->studentId = $session['student_id'];
        $this->appliedFilters = json_decode($session['applied_filters'], true) ?: [];

        return $this->getSessionState();
    }

    /**
     * Apply filter and shrink problem set
     */
    public function applyFilter($filterKey, $filterValue) {
        if (!$this->sessionId) {
            throw new Exception("No active session");
        }

        // Add filter to applied filters
        $this->appliedFilters[] = [
            'key' => $filterKey,
            'value' => $filterValue,
            'applied_at' => date('Y-m-d H:i:s')
        ];

        // Calculate new problem count
        $newCount = $this->getFilteredProblemCount();

        // Update session
        $this->db->query(
            "UPDATE filter_sessions SET
                applied_filters = ?,
                remaining_count = ?,
                current_step = ?
            WHERE id = ?",
            [
                json_encode($this->appliedFilters),
                $newCount,
                count($this->appliedFilters),
                $this->sessionId
            ]
        );

        return [
            'success' => true,
            'filter_applied' => $filterKey,
            'value' => $filterValue,
            'previous_count' => $this->getPreviousCount(),
            'current_count' => $newCount,
            'reduction_percentage' => $this->calculateReductionPercentage(),
            'next_filters' => $this->getNextAvailableFilters()
        ];
    }

    /**
     * Remove last applied filter (undo)
     */
    public function removeLastFilter() {
        if (empty($this->appliedFilters)) {
            throw new Exception("No filters to remove");
        }

        $removed = array_pop($this->appliedFilters);
        $newCount = $this->getFilteredProblemCount();

        $this->db->query(
            "UPDATE filter_sessions SET
                applied_filters = ?,
                remaining_count = ?,
                current_step = ?
            WHERE id = ?",
            [
                json_encode($this->appliedFilters),
                $newCount,
                count($this->appliedFilters),
                $this->sessionId
            ]
        );

        return [
            'success' => true,
            'removed_filter' => $removed,
            'current_count' => $newCount
        ];
    }

    /**
     * Get filtered problems
     */
    public function getFilteredProblems($limit = 10, $offset = 0) {
        $sql = "SELECT p.* FROM problems p WHERE p.is_active = TRUE";
        $params = [];

        // Apply each filter sequentially
        foreach ($this->appliedFilters as $index => $filter) {
            $alias = "pf" . $index;
            $sql .= " INNER JOIN problem_filters $alias ON p.id = $alias.problem_id";
            $sql .= " AND $alias.filter_key = ? AND $alias.filter_value = ?";
            $params[] = $filter['key'];
            $params[] = $filter['value'];
        }

        $sql .= " ORDER BY p.id LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get count of filtered problems
     */
    private function getFilteredProblemCount() {
        $sql = "SELECT COUNT(DISTINCT p.id) as count FROM problems p WHERE p.is_active = TRUE";
        $params = [];

        foreach ($this->appliedFilters as $index => $filter) {
            $alias = "pf" . $index;
            $sql .= " INNER JOIN problem_filters $alias ON p.id = $alias.problem_id";
            $sql .= " AND $alias.filter_key = ? AND $alias.filter_value = ?";
            $params[] = $filter['key'];
            $params[] = $filter['value'];
        }

        $result = $this->db->fetchOne($sql, $params);
        return (int)$result['count'];
    }

    /**
     * Get initial problem count (no filters)
     */
    private function getAvailableProblemCount() {
        $result = $this->db->fetchOne(
            "SELECT COUNT(*) as count FROM problems WHERE is_active = TRUE"
        );
        return (int)$result['count'];
    }

    /**
     * Get all available filters
     */
    public function getAvailableFilters() {
        $filters = $this->db->fetchAll(
            "SELECT fd.*,
                (SELECT COUNT(*) FROM filter_options WHERE filter_id = fd.id AND is_active = TRUE) as option_count
            FROM filter_definitions fd
            WHERE fd.is_active = TRUE
            ORDER BY fd.filter_order"
        );

        foreach ($filters as &$filter) {
            $filter['options'] = $this->db->fetchAll(
                "SELECT option_value, option_label
                FROM filter_options
                WHERE filter_id = ? AND is_active = TRUE
                ORDER BY option_order",
                [$filter['id']]
            );

            // Get count for each option based on current filters
            foreach ($filter['options'] as &$option) {
                $option['problem_count'] = $this->getCountForOption(
                    $filter['filter_key'],
                    $option['option_value']
                );
            }
        }

        return $filters;
    }

    /**
     * Get filters that haven't been applied yet
     */
    private function getNextAvailableFilters() {
        $appliedKeys = array_column($this->appliedFilters, 'key');
        $allFilters = $this->getAvailableFilters();

        return array_filter($allFilters, function($filter) use ($appliedKeys) {
            return !in_array($filter['filter_key'], $appliedKeys);
        });
    }

    /**
     * Get problem count if specific filter option is applied
     */
    private function getCountForOption($filterKey, $filterValue) {
        $tempFilters = $this->appliedFilters;
        $tempFilters[] = ['key' => $filterKey, 'value' => $filterValue];

        $sql = "SELECT COUNT(DISTINCT p.id) as count FROM problems p WHERE p.is_active = TRUE";
        $params = [];

        foreach ($tempFilters as $index => $filter) {
            $alias = "pf" . $index;
            $sql .= " INNER JOIN problem_filters $alias ON p.id = $alias.problem_id";
            $sql .= " AND $alias.filter_key = ? AND $alias.filter_value = ?";
            $params[] = $filter['key'];
            $params[] = $filter['value'];
        }

        $result = $this->db->fetchOne($sql, $params);
        return (int)$result['count'];
    }

    /**
     * Get previous problem count
     */
    private function getPreviousCount() {
        if (count($this->appliedFilters) <= 1) {
            return $this->getAvailableProblemCount();
        }

        // Temporarily remove last filter and count
        $lastFilter = array_pop($this->appliedFilters);
        $count = $this->getFilteredProblemCount();
        $this->appliedFilters[] = $lastFilter;

        return $count;
    }

    /**
     * Calculate reduction percentage
     */
    private function calculateReductionPercentage() {
        $previous = $this->getPreviousCount();
        $current = $this->getFilteredProblemCount();

        if ($previous === 0) {
            return 0;
        }

        return round((($previous - $current) / $previous) * 100, 2);
    }

    /**
     * Get current session state
     */
    public function getSessionState() {
        $session = $this->db->fetchOne(
            "SELECT * FROM filter_sessions WHERE id = ?",
            [$this->sessionId]
        );

        if (!$session) {
            throw new Exception("Session not found");
        }

        return [
            'session_id' => $this->sessionId,
            'student_id' => $session['student_id'],
            'applied_filters' => json_decode($session['applied_filters'], true),
            'current_step' => $session['current_step'],
            'remaining_count' => $session['remaining_count'],
            'is_completed' => (bool)$session['is_completed'],
            'available_filters' => $this->getNextAvailableFilters(),
            'shrink_history' => $this->getShrinkHistory()
        ];
    }

    /**
     * Get shrink history (how counts changed)
     */
    private function getShrinkHistory() {
        $history = [];
        $tempFilters = [];

        // Initial state
        $history[] = [
            'step' => 0,
            'filter' => null,
            'count' => $this->getAvailableProblemCount()
        ];

        // Each applied filter
        foreach ($this->appliedFilters as $index => $filter) {
            $tempFilters[] = $filter;
            $oldFilters = $this->appliedFilters;
            $this->appliedFilters = $tempFilters;

            $history[] = [
                'step' => $index + 1,
                'filter' => $filter,
                'count' => $this->getFilteredProblemCount()
            ];

            $this->appliedFilters = $oldFilters;
        }

        return $history;
    }

    /**
     * Select final problem(s)
     */
    public function selectProblems($count = 1) {
        $problems = $this->getFilteredProblems($count);

        // Mark session as completed
        $this->db->query(
            "UPDATE filter_sessions SET
                is_completed = TRUE,
                completed_at = NOW()
            WHERE id = ?",
            [$this->sessionId]
        );

        return [
            'success' => true,
            'selected_problems' => $problems,
            'total_filtered' => $this->getFilteredProblemCount(),
            'shrink_history' => $this->getShrinkHistory()
        ];
    }

    /**
     * Clear all filters and reset session
     */
    public function resetSession() {
        $this->appliedFilters = [];
        $initialCount = $this->getAvailableProblemCount();

        $this->db->query(
            "UPDATE filter_sessions SET
                applied_filters = '[]',
                remaining_count = ?,
                current_step = 0
            WHERE id = ?",
            [$initialCount, $this->sessionId]
        );

        return $this->getSessionState();
    }
}
