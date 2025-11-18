<?php include __DIR__ . '/layout/header.php'; ?>

<div class="row">
    <div class="col-12">
        <h1 class="mb-4">
            <i class="fas fa-chalkboard-teacher"></i> Teacher Dashboard
        </h1>
    </div>
</div>

<!-- Quick Stats -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <h5 class="card-title">Total Problems</h5>
                <h2><?php echo count($problems); ?></h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-success">
            <div class="card-body">
                <h5 class="card-title">Active Problems</h5>
                <h2><?php echo count(array_filter($problems, function($p) { return $p['active'] == 1; })); ?></h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-info">
            <div class="card-body">
                <h5 class="card-title">Total Submissions</h5>
                <h2><?php echo array_sum(array_column($problems, 'stats')); ?></h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white" style="background-color: #764ba2;">
            <div class="card-body">
                <h5 class="card-title">Avg Success Rate</h5>
                <h2>
                    <?php
                    $totalSubs = 0;
                    $totalCorrect = 0;
                    foreach ($problems as $p) {
                        if ($p['stats']) {
                            $totalSubs += $p['stats']['total_submissions'];
                            $totalCorrect += $p['stats']['correct_submissions'];
                        }
                    }
                    echo $totalSubs > 0 ? round(($totalCorrect / $totalSubs) * 100) : 0;
                    ?>%
                </h2>
            </div>
        </div>
    </div>
</div>

<!-- Actions -->
<div class="row mb-4">
    <div class="col-12">
        <a href="/problem/create" class="btn btn-primary btn-lg">
            <i class="fas fa-plus-circle"></i> Create New Problem
        </a>
        <a href="/problems" class="btn btn-outline-primary btn-lg">
            <i class="fas fa-list"></i> View All Problems
        </a>
    </div>
</div>

<!-- Recent Problems -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <i class="fas fa-book"></i> Your Problems
            </div>
            <div class="card-body">
                <?php if (empty($problems)): ?>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> You haven't created any problems yet.
                        <a href="/problem/create" class="alert-link">Create your first problem</a>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Difficulty</th>
                                    <th>Submissions</th>
                                    <th>Success Rate</th>
                                    <th>Avg Score</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($problems as $problem): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo htmlspecialchars($problem['title']); ?></strong>
                                        </td>
                                        <td>
                                            <span class="badge badge-secondary">
                                                <?php echo htmlspecialchars($problem['problem_type']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php
                                            $stars = str_repeat('⭐', $problem['difficulty_level']);
                                            echo $stars;
                                            ?>
                                        </td>
                                        <td>
                                            <?php echo $problem['stats']['total_submissions'] ?? 0; ?>
                                        </td>
                                        <td>
                                            <?php
                                            if ($problem['stats'] && $problem['stats']['total_submissions'] > 0) {
                                                $rate = round(($problem['stats']['correct_submissions'] / $problem['stats']['total_submissions']) * 100);
                                                $color = $rate >= 70 ? 'success' : ($rate >= 40 ? 'warning' : 'danger');
                                                echo "<span class='badge badge-{$color}'>{$rate}%</span>";
                                            } else {
                                                echo '<span class="text-muted">N/A</span>';
                                            }
                                            ?>
                                        </td>
                                        <td>
                                            <?php
                                            if ($problem['stats'] && $problem['stats']['avg_score']) {
                                                echo round($problem['stats']['avg_score'], 1) . '/' . $problem['points'];
                                            } else {
                                                echo '<span class="text-muted">N/A</span>';
                                            }
                                            ?>
                                        </td>
                                        <td>
                                            <?php if ($problem['active']): ?>
                                                <span class="badge badge-success">Active</span>
                                            <?php else: ?>
                                                <span class="badge badge-secondary">Inactive</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <a href="/problem/view?id=<?php echo $problem['id']; ?>"
                                                   class="btn btn-info" title="View">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="/problem/edit?id=<?php echo $problem['id']; ?>"
                                                   class="btn btn-primary" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                            </div>
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
