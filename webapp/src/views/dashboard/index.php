<div class="row mb-4">
    <div class="col">
        <h1><i class="bi bi-speedometer2"></i> 대시보드</h1>
        <p class="lead text-muted">환영합니다, <?= View::e($user['full_name'] ?? $user['username']) ?>님!</p>
    </div>
</div>

<?php if (AuthController::isTeacher()): ?>
<!-- Teacher Dashboard -->
<div class="row g-4 mb-4">
    <div class="col-md-3">
        <div class="card bg-primary text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">생성한 활동</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-puzzle" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="card bg-success text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">참여 학생</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-people" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="card bg-warning text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">진행 중</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-hourglass-split" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="card bg-info text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">완료</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-check-circle" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-list-check"></i> 내 활동</h5>
            </div>
            <div class="card-body">
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-inbox" style="font-size: 4rem;"></i>
                    <p class="mt-3">아직 생성한 활동이 없습니다.</p>
                    <a href="<?= BASE_URL ?>/activities/create" class="btn btn-primary">
                        <i class="bi bi-plus-circle"></i> 첫 활동 만들기
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-lightbulb"></i> 빠른 시작</h5>
            </div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <a href="<?= BASE_URL ?>/activities/create" class="btn btn-outline-primary">
                        <i class="bi bi-plus-lg"></i> 새 활동 만들기
                    </a>
                    <a href="<?= BASE_URL ?>/activities" class="btn btn-outline-secondary">
                        <i class="bi bi-folder"></i> 모든 활동 보기
                    </a>
                    <a href="<?= BASE_URL ?>/help" class="btn btn-outline-info">
                        <i class="bi bi-question-circle"></i> 사용 가이드
                    </a>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-graph-up"></i> 팁</h5>
            </div>
            <div class="card-body">
                <small class="text-muted">
                    <ul class="ps-3 mb-0">
                        <li class="mb-2">각 단계마다 명확한 힌트를 제공하세요</li>
                        <li class="mb-2">최소 대안 수는 2-3개가 적당합니다</li>
                        <li>학생들의 탐색 과정을 정기적으로 확인하세요</li>
                    </ul>
                </small>
            </div>
        </div>
    </div>
</div>

<?php else: ?>
<!-- Student Dashboard -->
<div class="row g-4 mb-4">
    <div class="col-md-4">
        <div class="card bg-primary text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">참여 중인 활동</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-bookmark" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card bg-warning text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">진행 중</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-hourglass-split" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card bg-success text-white">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title text-white-50">완료한 활동</h6>
                        <h2 class="mb-0">0</h2>
                    </div>
                    <i class="bi bi-check-circle" style="font-size: 3rem; opacity: 0.3;"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-play-circle"></i> 계속하기</h5>
            </div>
            <div class="card-body">
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-inbox" style="font-size: 4rem;"></i>
                    <p class="mt-3">진행 중인 활동이 없습니다.</p>
                    <a href="<?= BASE_URL ?>/activities" class="btn btn-primary">
                        <i class="bi bi-search"></i> 활동 찾아보기
                    </a>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-star"></i> 추천 활동</h5>
            </div>
            <div class="card-body">
                <div class="text-center py-4 text-muted">
                    <p>추천 활동이 준비되는 중입니다.</p>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-award"></i> 나의 성취</h5>
            </div>
            <div class="card-body">
                <div class="text-center mb-3">
                    <div class="display-1 text-muted">
                        <i class="bi bi-trophy"></i>
                    </div>
                    <h3 class="mb-0">0</h3>
                    <small class="text-muted">완료한 활동</small>
                </div>

                <hr>

                <div class="text-start">
                    <small class="text-muted">
                        <div class="mb-2">
                            <i class="bi bi-lightbulb-fill text-warning"></i>
                            <strong>평균 대안 수:</strong> -
                        </div>
                        <div class="mb-2">
                            <i class="bi bi-graph-up text-success"></i>
                            <strong>평균 자신감:</strong> -
                        </div>
                        <div>
                            <i class="bi bi-clock text-info"></i>
                            <strong>총 학습 시간:</strong> -
                        </div>
                    </small>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="bi bi-question-circle"></i> 도움말</h5>
            </div>
            <div class="card-body">
                <small class="text-muted">
                    <p><strong>대안적 풀이란?</strong></p>
                    <p>한 문제를 여러 방법으로 해결해보는 과정입니다. 다양한 접근법을 탐색하면서 창의적 사고력을 키울 수 있습니다.</p>
                </small>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>
