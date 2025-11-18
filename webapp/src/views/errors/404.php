<div class="row justify-content-center">
    <div class="col-md-6 text-center">
        <div class="py-5">
            <i class="bi bi-exclamation-triangle" style="font-size: 6rem; color: var(--warning-color);"></i>
            <h1 class="display-1 fw-bold mt-4">404</h1>
            <h2 class="mb-4">페이지를 찾을 수 없습니다</h2>
            <p class="lead text-muted mb-4">
                <?= isset($message) ? View::e($message) : '요청하신 페이지가 존재하지 않거나 이동되었습니다.' ?>
            </p>
            <a href="<?= BASE_URL ?>/dashboard" class="btn btn-primary btn-lg">
                <i class="bi bi-house"></i> 대시보드로 돌아가기
            </a>
        </div>
    </div>
</div>
