<?php include __DIR__ . '/layout/header.php'; ?>

<div class="row">
    <div class="col-12">
        <h1 class="mb-4">
            <i class="fas fa-user-graduate"></i> Student Dashboard
        </h1>
        <p class="lead">Welcome, <?php echo htmlspecialchars($user['full_name']); ?>!</p>
    </div>
</div>

<!-- Quick Stats -->
<div class="row mb-4">
    <div class="col-md-4">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <h5 class="card-title">Problems Attempted</h5>
                <h2><?php echo count($submissions); ?></h2>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card text-white bg-success">
            <div class="card-body">
                <h5 class="card-title">Problems Correct</h5>
                <h2><?php echo count(array_filter($submissions, function($s) { return $s['is_correct'] == 1; })); ?></h2>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card text-white bg-info">
            <div class="card-body">
                <h5 class="card-title">Average Score</h5>
                <h2>
                    <?php
                    $gradedSubmissions = array_filter($submissions, function($s) {
                        return $s['status'] === 'graded' && $s['score'] !== null;
                    });
                    if (count($gradedSubmissions) > 0) {
                        $avgScore = array_sum(array_column($gradedSubmissions, 'score')) / count($gradedSubmissions);
                        $avgMax = array_sum(array_column($gradedSubmissions, 'max_score')) / count($gradedSubmissions);
                        echo round(($avgScore / $avgMax) * 100) . '%';
                    } else {
                        echo 'N/A';
                    }
                    ?>
                </h2>
            </div>
        </div>
    </div>
</div>

<!-- Available Problems -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <i class="fas fa-book-open"></i> Available Problems
            </div>
            <div class="card-body">
                <?php if (empty($availableProblems)): ?>
                    <div class="alert alert-info">
                        <i class="fas fa-check-circle"></i> Great job! You've attempted all available problems.
                    </div>
                <?php else: ?>
                    <div class="row">
                        <?php foreach ($availableProblems as $problem): ?>
                            <div class="col-md-6 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title"><?php echo htmlspecialchars($problem['title']); ?></h5>
                                        <p class="card-text"><?php echo htmlspecialchars($problem['description']); ?></p>
                                        <div class="mb-2">
                                            <span class="badge badge-secondary">
                                                <?php echo htmlspecialchars($problem['problem_type']); ?>
                                            </span>
                                            <span class="badge badge-info">
                                                Difficulty: <?php echo str_repeat('⭐', $problem['difficulty_level']); ?>
                                            </span>
                                            <span class="badge badge-success">
                                                <?php echo $problem['points']; ?> points
                                            </span>
                                        </div>
                                        <?php if ($problem['time_limit_minutes']): ?>
                                            <p class="text-muted">
                                                <i class="fas fa-clock"></i> Time limit: <?php echo $problem['time_limit_minutes']; ?> minutes
                                            </p>
                                        <?php endif; ?>
                                    </div>
                                    <div class="card-footer">
                                        <a href="/problem/view?id=<?php echo $problem['id']; ?>"
                                           class="btn btn-primary btn-block">
                                            <i class="fas fa-play-circle"></i> Start Problem
                                        </a>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- My Submissions -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <i class="fas fa-history"></i> My Submissions
            </div>
            <div class="card-body">
                <?php if (empty($submissions)): ?>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> You haven't submitted any problems yet.
                        Check out the available problems above to get started!
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Problem</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                    <th>Result</th>
                                    <th>Score</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($submissions as $submission): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo htmlspecialchars($submission['problem_title']); ?></strong>
                                        </td>
                                        <td>
                                            <?php echo $submission['submitted_at'] ? date('Y-m-d H:i', strtotime($submission['submitted_at'])) : '<span class="text-muted">Not submitted</span>'; ?>
                                        </td>
                                        <td>
                                            <?php
                                            $statusColors = [
                                                'draft' => 'secondary',
                                                'submitted' => 'warning',
                                                'graded' => 'success',
                                                'returned' => 'info'
                                            ];
                                            $color = $statusColors[$submission['status']] ?? 'secondary';
                                            echo "<span class='badge badge-{$color}'>" . ucfirst($submission['status']) . "</span>";
                                            ?>
                                        </td>
                                        <td>
                                            <?php if ($submission['is_correct'] !== null): ?>
                                                <?php if ($submission['is_correct']): ?>
                                                    <span class="badge badge-success">
                                                        <i class="fas fa-check-circle"></i> Correct
                                                    </span>
                                                <?php else: ?>
                                                    <span class="badge badge-danger">
                                                        <i class="fas fa-times-circle"></i> Incorrect
                                                    </span>
                                                <?php endif; ?>
                                            <?php else: ?>
                                                <span class="text-muted">Pending</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($submission['score'] !== null): ?>
                                                <strong><?php echo $submission['score']; ?></strong> / <?php echo $submission['max_score']; ?>
                                            <?php else: ?>
                                                <span class="text-muted">-</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <a href="/submission/view?id=<?php echo $submission['id']; ?>"
                                               class="btn btn-sm btn-info">
                                                <i class="fas fa-eye"></i> View
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/layout/footer.php'; ?>
