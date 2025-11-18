/**
 * Dashboard JavaScript
 * 대시보드 스크립트
 */

(function() {
    'use strict';

    // Chart.js 설정
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Noto Sans KR', sans-serif";
        Chart.defaults.font.size = 12;
    }

    /**
     * 추세 차트 렌더링
     */
    function renderTrendChart(data) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const labels = data.map(item => item.date);
        const totalData = data.map(item => parseInt(item.total));
        const cautionData = data.map(item => parseInt(item.caution));
        const warningData = data.map(item => parseInt(item.warning));
        const dangerData = data.map(item => parseInt(item.danger));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '전체',
                        data: totalData,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Level 1 (주의)',
                        data: cautionData,
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Level 2 (경고)',
                        data: warningData,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Level 3 (위험)',
                        data: dangerData,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    /**
     * 학생별 차트 렌더링
     */
    function renderStudentChart(stats) {
        const ctx = document.getElementById('studentChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['빠른 정답', '빠른 오답', '정상'],
                datasets: [{
                    data: [
                        stats.fast_correct,
                        stats.fast_incorrect,
                        stats.total_attempts - stats.total_flags
                    ],
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * 실시간 업데이트 폴링
     */
    function startRealtimeUpdates() {
        const interval = 30000; // 30초

        setInterval(function() {
            // 미검토 플래그 수 업데이트
            $.get('/api/unreviewed-count.php', function(data) {
                if (data.count > 0) {
                    $('#unreviewedCount').text(data.count).show();
                    // 알림음 재생 (선택사항)
                    // playNotificationSound();
                }
            });
        }, interval);
    }

    /**
     * 플래그 검토 처리
     */
    window.reviewFlag = function(flagId, notes) {
        if (!confirm('이 플래그를 검토 완료 처리하시겠습니까?')) {
            return;
        }

        $.ajax({
            url: '/api/review-flag.php',
            method: 'POST',
            data: {
                flag_id: flagId,
                notes: notes || '검토 완료'
            },
            success: function(response) {
                if (response.success) {
                    showNotification('검토가 완료되었습니다.', 'success');
                    // 행 페이드아웃 후 제거
                    $(`tr[data-flag-id="${flagId}"]`).fadeOut(300, function() {
                        $(this).remove();
                    });
                } else {
                    showNotification('처리 중 오류가 발생했습니다.', 'error');
                }
            },
            error: function() {
                showNotification('서버 오류가 발생했습니다.', 'error');
            }
        });
    };

    /**
     * 알림 메시지 표시
     */
    function showNotification(message, type) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const notification = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
            </div>
        `);

        $('#notificationArea').append(notification);

        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }

    /**
     * 필터 적용
     */
    window.applyFilters = function() {
        const filters = {
            quiz_id: $('#filterQuiz').val(),
            flag_level: $('#filterLevel').val(),
            date_from: $('#filterDateFrom').val(),
            date_to: $('#filterDateTo').val(),
            is_reviewed: $('#filterReviewed').val()
        };

        const queryString = $.param(filters);
        window.location.href = `?view=flags&${queryString}`;
    };

    /**
     * 데이터 테이블 초기화
     */
    function initDataTable() {
        if ($.fn.DataTable) {
            $('.data-table').DataTable({
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/ko.json'
                },
                pageLength: 20,
                order: [[0, 'desc']]
            });
        }
    }

    /**
     * 툴팁 초기화
     */
    function initTooltips() {
        $('[data-toggle="tooltip"]').tooltip();
    }

    /**
     * 자동 새로고침
     */
    function initAutoRefresh() {
        const refreshInterval = 30000; // 30초
        const autoRefresh = $('#autoRefresh').is(':checked');

        if (autoRefresh) {
            setTimeout(function() {
                location.reload();
            }, refreshInterval);
        }
    }

    /**
     * 통계 애니메이션
     */
    function animateStats() {
        $('.stat-card h2').each(function() {
            const $this = $(this);
            const countTo = parseInt($this.text().replace(/,/g, ''));

            $({countNum: 0}).animate({
                countNum: countTo
            }, {
                duration: 1000,
                easing: 'swing',
                step: function() {
                    $this.text(Math.floor(this.countNum).toLocaleString());
                },
                complete: function() {
                    $this.text(this.countNum.toLocaleString());
                }
            });
        });
    }

    /**
     * 초기화
     */
    $(document).ready(function() {
        console.log('Dashboard initialized');

        // 차트 렌더링
        if (typeof trendData !== 'undefined') {
            renderTrendChart(trendData);
        }

        if (typeof studentStats !== 'undefined') {
            renderStudentChart(studentStats);
        }

        // 기능 초기화
        initTooltips();
        initDataTable();
        animateStats();

        // 실시간 업데이트 시작
        // startRealtimeUpdates(); // 필요시 활성화

        // 자동 새로고침
        // initAutoRefresh(); // 필요시 활성화
    });

    // 전역으로 노출
    window.DashboardApp = {
        renderTrendChart: renderTrendChart,
        renderStudentChart: renderStudentChart,
        showNotification: showNotification
    };

})();
