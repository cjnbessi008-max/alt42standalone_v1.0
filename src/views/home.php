<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
        }
        .hero-card {
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card hero-card">
                    <div class="card-body text-center py-5">
                        <h1 class="display-4 mb-4">
                            <i class="fas fa-calculator text-primary"></i><br>
                            <?php echo APP_NAME; ?>
                        </h1>
                        <p class="lead text-muted mb-4">
                            Moodle와 연동된 수학 문제 자기평가 시스템
                        </p>

                        <div class="row mb-5">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <i class="fas fa-book-open fa-3x text-primary"></i>
                                </div>
                                <h5>문제 풀이</h5>
                                <p class="text-muted small">다양한 수학 문제를 풀고 학습하세요</p>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <i class="fas fa-check-double fa-3x text-success"></i>
                                </div>
                                <h5>자기 검산</h5>
                                <p class="text-muted small">검산 근거를 스스로 작성하여 논리적 사고력 향상</p>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <i class="fas fa-robot fa-3x text-info"></i>
                                </div>
                                <h5>AI 피드백</h5>
                                <p class="text-muted small">검산 품질에 대한 즉각적인 AI 분석</p>
                            </div>
                        </div>

                        <div class="alert alert-info">
                            <h5><i class="fas fa-link"></i> LTI 연동 필요</h5>
                            <p class="mb-0">
                                이 시스템은 Moodle LMS와 LTI 연동을 통해 접근합니다.<br>
                                Moodle의 외부 도구로 추가한 후 사용하세요.
                            </p>
                        </div>

                        <hr>

                        <div class="row">
                            <div class="col-md-6 mb-2">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6><i class="fas fa-user-graduate"></i> 학생</h6>
                                        <p class="small mb-0">문제를 풀고 검산 근거를 작성하세요</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6><i class="fas fa-chalkboard-teacher"></i> 교사</h6>
                                        <p class="small mb-0">문제를 출제하고 학생 결과를 확인하세요</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p class="text-muted small mt-4 mb-0">
                            <i class="fas fa-info-circle"></i> Version <?php echo APP_VERSION; ?> | KAIST Touch Math Academy
                        </p>
                    </div>
                </div>

                <div class="text-center mt-4">
                    <p class="text-white">
                        <i class="fas fa-book"></i>
                        <a href="https://docs.moodle.org/en/External_tool" class="text-white" target="_blank">
                            Moodle LTI 설정 가이드
                        </a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
