<?php
/**
 * Weak Concept Link Detection System - Main Dashboard
 */

require_once __DIR__ . '/../config/config.php';

// Initialize components
$db = Database::getInstance();
$detector = new WeakLinkDetector();
$extractor = new ConceptExtractor();

// Get statistics
$weakLinkStats = $detector->getWeakLinkStats();
$weakLinks = $detector->getWeakLinks('detected');
$concepts = $extractor->getConceptsWithStats();

// Calculate summary stats
$totalWeakLinks = $weakLinkStats['summary']['total_weak_links'] ?? 0;
$newLinks = $weakLinkStats['summary']['new_links'] ?? 0;
$avgWeaknessScore = $weakLinkStats['summary']['avg_weakness_score'] ?? 0;
$affectedStudents = $weakLinkStats['summary']['total_affected_students'] ?? 0;

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>약한 개념 연결 탐지 시스템</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>🔗 약한 개념 연결 탐지 시스템</h1>
            <p>Moodle LMS 연동 - 학습 개념 간 연결 약점 자동 발견</p>
        </div>
    </header>

    <div class="container">
        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card danger">
                <div class="stat-value"><?= $newLinks ?></div>
                <div class="stat-label">새로 발견된 약한 연결</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-value"><?= round($avgWeaknessScore, 1) ?>%</div>
                <div class="stat-label">평균 약점 점수</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= count($concepts) ?></div>
                <div class="stat-label">분석된 개념</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= $affectedStudents ?></div>
                <div class="stat-label">영향받는 학생 수</div>
            </div>
        </div>

        <!-- Actions -->
        <div class="card">
            <h2>⚙️ 시스템 작업</h2>
            <a href="sync.php" class="btn btn-primary">📥 Moodle 데이터 동기화</a>
            <a href="analyze.php" class="btn btn-success">🔍 약한 연결 분석 실행</a>
            <a href="network.php" class="btn btn-warning">📊 개념 네트워크 보기</a>
        </div>

        <!-- Weak Links List -->
        <div class="card">
            <h2>🚨 발견된 약한 연결 지점 (Top 10)</h2>

            <?php if (empty($weakLinks)): ?>
                <div class="alert alert-info">
                    아직 약한 연결이 발견되지 않았습니다. "약한 연결 분석 실행" 버튼을 클릭하여 분석을 시작하세요.
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>개념 연결</th>
                            <th>약점 유형</th>
                            <th>약점 점수</th>
                            <th>영향받는 학생</th>
                            <th>권장사항</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($weakLinks, 0, 10) as $link): ?>
                            <tr>
                                <td>
                                    <strong><?= htmlspecialchars($link['source_concept_name']) ?></strong>
                                    →
                                    <strong><?= htmlspecialchars($link['target_concept_name']) ?></strong>
                                </td>
                                <td>
                                    <?php
                                    $typeLabels = [
                                        'low_accuracy' => '낮은 정답률',
                                        'high_correlation' => '높은 오답 상관관계',
                                        'prerequisite_failure' => '선수 개념 미숙',
                                        'concept_gap' => '개념 간격'
                                    ];
                                    $badgeClass = 'badge-danger';
                                    if ($link['weakness_type'] == 'concept_gap') $badgeClass = 'badge-warning';
                                    ?>
                                    <span class="badge <?= $badgeClass ?>">
                                        <?= $typeLabels[$link['weakness_type']] ?? $link['weakness_type'] ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="progress">
                                        <?php
                                        $score = round($link['weakness_score'], 1);
                                        $progressClass = $score > 70 ? 'danger' : ($score > 40 ? 'warning' : '');
                                        ?>
                                        <div class="progress-bar <?= $progressClass ?>"
                                             style="width: <?= $score ?>%">
                                            <?= $score ?>%
                                        </div>
                                    </div>
                                </td>
                                <td><?= $link['affected_students'] ?? 'N/A' ?></td>
                                <td style="font-size: 0.9em;">
                                    <?= htmlspecialchars($link['recommendation']) ?>
                                </td>
                                <td>
                                    <span class="badge badge-info"><?= $link['status'] ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php if (count($weakLinks) > 10): ?>
                    <p style="margin-top: 15px; text-align: center;">
                        <a href="weak-links.php" class="btn btn-primary">모든 약한 연결 보기 (<?= count($weakLinks) ?>개)</a>
                    </p>
                <?php endif; ?>
            <?php endif; ?>
        </div>

        <!-- Concepts Overview -->
        <div class="card">
            <h2>📚 개념 개요 (정확도 낮은 순)</h2>

            <?php if (empty($concepts)): ?>
                <div class="alert alert-info">
                    아직 개념이 추출되지 않았습니다. Moodle 데이터를 동기화해주세요.
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>개념명</th>
                            <th>카테고리</th>
                            <th>관련 문제 수</th>
                            <th>평균 정답률</th>
                            <th>평균 난이도</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($concepts, 0, 10) as $concept): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($concept['name']) ?></strong></td>
                                <td><?= htmlspecialchars($concept['category'] ?? 'N/A') ?></td>
                                <td><?= $concept['question_count'] ?? 0 ?></td>
                                <td>
                                    <?php
                                    $accuracy = round($concept['avg_accuracy'] ?? 0, 1);
                                    $progressClass = $accuracy < 60 ? 'danger' : ($accuracy < 75 ? 'warning' : 'success');
                                    ?>
                                    <div class="progress">
                                        <div class="progress-bar <?= $progressClass ?>"
                                             style="width: <?= $accuracy ?>%">
                                            <?= $accuracy ?>%
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <?php
                                    $difficulty = round(($concept['avg_difficulty'] ?? 0) * 100, 1);
                                    ?>
                                    <?= $difficulty ?>%
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- Type Breakdown -->
        <?php if (!empty($weakLinkStats['by_type'])): ?>
            <div class="card">
                <h2>📊 약한 연결 유형별 통계</h2>
                <table>
                    <thead>
                        <tr>
                            <th>유형</th>
                            <th>발견 건수</th>
                            <th>비율</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $total = array_sum(array_column($weakLinkStats['by_type'], 'count'));
                        foreach ($weakLinkStats['by_type'] as $type):
                            $typeLabels = [
                                'low_accuracy' => '낮은 정답률',
                                'high_correlation' => '높은 오답 상관관계',
                                'prerequisite_failure' => '선수 개념 미숙',
                                'concept_gap' => '개념 간격'
                            ];
                            $percentage = $total > 0 ? round(($type['count'] / $total) * 100, 1) : 0;
                        ?>
                            <tr>
                                <td><?= $typeLabels[$type['weakness_type']] ?? $type['weakness_type'] ?></td>
                                <td><?= $type['count'] ?></td>
                                <td>
                                    <div class="progress">
                                        <div class="progress-bar" style="width: <?= $percentage ?>%">
                                            <?= $percentage ?>%
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <footer>
        <p>Weak Concept Link Detection System v1.0 | Moodle 3.7 + PHP 7.1.9 + MySQL 5.7</p>
        <p>KAIST Touch Math Academy</p>
    </footer>
</body>
</html>
