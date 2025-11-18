<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>전제지식 체크 시스템 - Moodle LMS Integration</title>

    <!-- Bootstrap 4 CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-graduation-cap"></i> 전제지식 체크 시스템
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item active">
                        <a class="nav-link" href="#"><i class="fas fa-home"></i> 대시보드</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" id="conceptsLink"><i class="fas fa-brain"></i> 지식 개념</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" id="studentsLink"><i class="fas fa-user-graduate"></i> 학생</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container mt-4">
        <!-- System Status -->
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title"><i class="fas fa-heartbeat"></i> 시스템 상태</h5>
                        <div id="systemStatus" class="mt-3">
                            <p class="text-muted">상태 확인 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Dashboard -->
        <div class="row">
            <!-- Student Checker -->
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0"><i class="fas fa-search"></i> 학생 전제지식 체크</h5>
                    </div>
                    <div class="card-body">
                        <form id="checkPrerequisitesForm">
                            <div class="form-group">
                                <label for="studentId">학생 Moodle ID</label>
                                <input type="number" class="form-control" id="studentId" placeholder="예: 123" required>
                            </div>
                            <div class="form-group">
                                <label for="conceptSelect">확인할 지식 개념</label>
                                <select class="form-control" id="conceptSelect" required>
                                    <option value="">개념을 선택하세요...</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-info btn-block">
                                <i class="fas fa-check-circle"></i> 전제지식 확인
                            </button>
                        </form>

                        <div id="prerequisiteResults" class="mt-4" style="display: none;">
                            <h6>체크 결과:</h6>
                            <div id="resultContent"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Course Assessment -->
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0"><i class="fas fa-chart-line"></i> 코스 평가</h5>
                    </div>
                    <div class="card-body">
                        <form id="assessCourseForm">
                            <div class="form-group">
                                <label for="courseSelect">Moodle 코스 선택</label>
                                <select class="form-control" id="courseSelect" required>
                                    <option value="">코스를 선택하세요...</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-success btn-block">
                                <i class="fas fa-sync-alt"></i> 전체 학생 평가
                            </button>
                        </form>

                        <div id="assessmentResults" class="mt-4" style="display: none;">
                            <h6>평가 결과:</h6>
                            <div id="assessmentContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Knowledge Concepts Overview -->
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="fas fa-brain"></i> 지식 개념 목록</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover" id="conceptsTable">
                                <thead>
                                    <tr>
                                        <th>개념명 (한글)</th>
                                        <th>개념명 (영문)</th>
                                        <th>학년</th>
                                        <th>난이도</th>
                                        <th>전제지식 수</th>
                                        <th>액션</th>
                                    </tr>
                                </thead>
                                <tbody id="conceptsTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center text-muted">로딩 중...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Prerequisite Detail Modal -->
    <div class="modal fade" id="prerequisiteModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-sitemap"></i> 전제지식 관계</h5>
                    <button type="button" class="close text-white" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" id="prerequisiteModalBody">
                    <!-- Content loaded dynamically -->
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-light py-4 mt-5">
        <div class="container text-center text-muted">
            <p class="mb-0">&copy; 2025 전제지식 체크 시스템 - Moodle 3.7 Integration</p>
            <p class="mb-0"><small>PHP 7.1.9 | MySQL 5.7</small></p>
        </div>
    </footer>

    <!-- jQuery, Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
