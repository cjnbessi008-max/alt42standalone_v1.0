<div class="row justify-content-center">
    <div class="col-md-5">
        <div class="card shadow-lg">
            <div class="card-body p-5">
                <div class="text-center mb-4">
                    <i class="bi bi-lightbulb-fill" style="font-size: 3rem; color: var(--primary-color);"></i>
                    <h2 class="mt-3">로그인</h2>
                    <p class="text-muted">대안적 풀이 시스템에 오신 것을 환영합니다</p>
                </div>

                <form method="POST" action="<?= BASE_URL ?>/login">
                    <?= View::csrf() ?>

                    <div class="mb-3">
                        <label for="username" class="form-label">
                            <i class="bi bi-person"></i> 사용자명 또는 이메일
                        </label>
                        <input type="text"
                               class="form-control form-control-lg"
                               id="username"
                               name="username"
                               required
                               autofocus
                               placeholder="사용자명 또는 이메일을 입력하세요">
                    </div>

                    <div class="mb-3">
                        <label for="password" class="form-label">
                            <i class="bi bi-lock"></i> 비밀번호
                        </label>
                        <input type="password"
                               class="form-control form-control-lg"
                               id="password"
                               name="password"
                               required
                               placeholder="비밀번호를 입력하세요">
                    </div>

                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="remember">
                        <label class="form-check-label" for="remember">
                            로그인 상태 유지
                        </label>
                    </div>

                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary btn-lg">
                            <i class="bi bi-box-arrow-in-right"></i> 로그인
                        </button>
                    </div>
                </form>

                <hr class="my-4">

                <div class="text-center">
                    <p class="mb-0">계정이 없으신가요?
                        <a href="<?= BASE_URL ?>/register" class="text-decoration-none">
                            회원가입 <i class="bi bi-arrow-right"></i>
                        </a>
                    </p>
                </div>

                <!-- Demo Accounts Info -->
                <div class="alert alert-info mt-4" role="alert">
                    <strong><i class="bi bi-info-circle"></i> 테스트 계정:</strong><br>
                    <small>
                        교사: <code>teacher1</code> / <code>admin123</code><br>
                        학생: <code>student1</code> / <code>admin123</code>
                    </small>
                </div>
            </div>
        </div>
    </div>
</div>
