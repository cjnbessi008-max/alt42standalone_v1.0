<div class="row justify-content-center">
    <div class="col-md-6">
        <div class="card shadow-lg">
            <div class="card-body p-5">
                <div class="text-center mb-4">
                    <i class="bi bi-person-plus-fill" style="font-size: 3rem; color: var(--secondary-color);"></i>
                    <h2 class="mt-3">회원가입</h2>
                    <p class="text-muted">새로운 계정을 만들어보세요</p>
                </div>

                <form method="POST" action="<?= BASE_URL ?>/register">
                    <?= View::csrf() ?>

                    <div class="mb-3">
                        <label for="role" class="form-label">
                            <i class="bi bi-person-badge"></i> 역할
                        </label>
                        <select class="form-select form-select-lg" id="role" name="role" required>
                            <option value="student">학생</option>
                            <option value="teacher">교사</option>
                        </select>
                        <div class="form-text">
                            학생은 활동에 참여하고, 교사는 활동을 만들고 관리할 수 있습니다.
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="username" class="form-label">
                            <i class="bi bi-person"></i> 사용자명 *
                        </label>
                        <input type="text"
                               class="form-control"
                               id="username"
                               name="username"
                               required
                               minlength="3"
                               pattern="[a-zA-Z0-9_]+"
                               placeholder="영문, 숫자, 언더스코어만 사용 (3자 이상)">
                    </div>

                    <div class="mb-3">
                        <label for="email" class="form-label">
                            <i class="bi bi-envelope"></i> 이메일 *
                        </label>
                        <input type="email"
                               class="form-control"
                               id="email"
                               name="email"
                               required
                               placeholder="example@domain.com">
                    </div>

                    <div class="mb-3">
                        <label for="full_name" class="form-label">
                            <i class="bi bi-card-text"></i> 이름
                        </label>
                        <input type="text"
                               class="form-control"
                               id="full_name"
                               name="full_name"
                               placeholder="실명 또는 표시할 이름">
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="password" class="form-label">
                                <i class="bi bi-lock"></i> 비밀번호 *
                            </label>
                            <input type="password"
                                   class="form-control"
                                   id="password"
                                   name="password"
                                   required
                                   minlength="<?= PASSWORD_MIN_LENGTH ?>"
                                   placeholder="<?= PASSWORD_MIN_LENGTH ?>자 이상">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="password_confirm" class="form-label">
                                <i class="bi bi-lock-fill"></i> 비밀번호 확인 *
                            </label>
                            <input type="password"
                                   class="form-control"
                                   id="password_confirm"
                                   name="password_confirm"
                                   required
                                   placeholder="비밀번호 재입력">
                        </div>
                    </div>

                    <div class="alert alert-light border">
                        <small>
                            <i class="bi bi-shield-check"></i>
                            <strong>개인정보 보호:</strong> 귀하의 정보는 안전하게 보호됩니다.
                        </small>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-success btn-lg">
                            <i class="bi bi-check-circle"></i> 가입하기
                        </button>
                        <a href="<?= BASE_URL ?>/login" class="btn btn-outline-secondary">
                            <i class="bi bi-arrow-left"></i> 로그인으로 돌아가기
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
// Password confirmation validation
document.addEventListener('DOMContentLoaded', function() {
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('password_confirm');

    function validatePassword() {
        if (password.value !== passwordConfirm.value) {
            passwordConfirm.setCustomValidity('비밀번호가 일치하지 않습니다.');
        } else {
            passwordConfirm.setCustomValidity('');
        }
    }

    password.addEventListener('change', validatePassword);
    passwordConfirm.addEventListener('keyup', validatePassword);
});
</script>
