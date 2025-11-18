/**
 * Log Graph with Area Color
 * Chart.js를 사용하여 로그 스케일 그래프에 Area Color를 적용
 */

class LogGraphManager {
    constructor() {
        this.mainChart = null;
        this.miniChart = null;
        this.logData = [];
    }

    /**
     * 메인 로그 그래프 초기화 (Area Color 적용)
     */
    initMainChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // 샘플 로그 데이터 생성
        const labels = this.generateTimeLabels(20);
        const data = this.generateLogScaleData(20);

        this.mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '학습 진행도 (로그 스케일)',
                    data: data,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.3)', // Area Color
                    borderWidth: 3,
                    fill: true, // 영역을 채우기 활성화
                    tension: 0.4, // 곡선 부드럽게
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(102, 126, 234, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                family: "'Noto Sans KR', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            family: "'Noto Sans KR', sans-serif"
                        },
                        bodyFont: {
                            size: 13,
                            family: "'Noto Sans KR', sans-serif"
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return '진행도: ' + context.parsed.y.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'logarithmic', // 로그 스케일 적용
                        title: {
                            display: true,
                            text: '진행도 (%)',
                            font: {
                                size: 14,
                                family: "'Noto Sans KR', sans-serif"
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '시간 (분)',
                            font: {
                                size: 14,
                                family: "'Noto Sans KR', sans-serif"
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    /**
     * 미니 로그 그래프 초기화 (스마트폰 화면용)
     */
    initMiniChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = this.generateTimeLabels(10);
        const data = this.generateLogScaleData(10);

        this.miniChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '진행도',
                    data: data,
                    borderColor: 'rgba(118, 75, 162, 1)',
                    backgroundColor: 'rgba(118, 75, 162, 0.4)', // Area Color (다른 색상)
                    borderWidth: 2,
                    fill: true, // 영역을 채우기 활성화
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(118, 75, 162, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'logarithmic', // 로그 스케일
                        display: true,
                        ticks: {
                            font: {
                                size: 9
                            },
                            callback: function(value) {
                                return value.toFixed(0);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        display: true,
                        ticks: {
                            font: {
                                size: 9
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 시간 레이블 생성
     */
    generateTimeLabels(count) {
        const labels = [];
        for (let i = 0; i < count; i++) {
            labels.push(`${i * 5}분`);
        }
        return labels;
    }

    /**
     * 로그 스케일 데이터 생성 (샘플)
     */
    generateLogScaleData(count) {
        const data = [];
        let baseValue = 1;

        for (let i = 0; i < count; i++) {
            // 로그 스케일에 적합한 증가 패턴
            baseValue = baseValue * (1 + Math.random() * 0.5);
            data.push(Math.min(baseValue, 100));
        }

        return data;
    }

    /**
     * 실시간 데이터 업데이트
     */
    updateChartData(newData) {
        if (this.mainChart) {
            this.mainChart.data.datasets[0].data.push(newData);
            if (this.mainChart.data.datasets[0].data.length > 20) {
                this.mainChart.data.datasets[0].data.shift();
            }
            this.mainChart.update('none');
        }

        if (this.miniChart) {
            this.miniChart.data.datasets[0].data.push(newData);
            if (this.miniChart.data.datasets[0].data.length > 10) {
                this.miniChart.data.datasets[0].data.shift();
            }
            this.miniChart.update('none');
        }
    }

    /**
     * LMS 데이터로 그래프 업데이트
     */
    updateFromLMS(lmsData) {
        if (!lmsData || !lmsData.progress) return;

        const progressData = lmsData.progress.map(item => item.score);
        const timeLabels = lmsData.progress.map((item, idx) => `${idx * 5}분`);

        if (this.mainChart) {
            this.mainChart.data.labels = timeLabels;
            this.mainChart.data.datasets[0].data = progressData;
            this.mainChart.update();
        }

        if (this.miniChart) {
            this.miniChart.data.labels = timeLabels.slice(-10);
            this.miniChart.data.datasets[0].data = progressData.slice(-10);
            this.miniChart.update();
        }
    }

    /**
     * 다중 데이터셋 추가 (비교 그래프)
     */
    addComparisonDataset(label, data, color) {
        if (!this.mainChart) return;

        const newDataset = {
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: color.replace('1)', '0.3)'), // 투명도 조정
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: color,
        };

        this.mainChart.data.datasets.push(newDataset);
        this.mainChart.update();
    }

    /**
     * 그래프 초기화
     */
    destroy() {
        if (this.mainChart) {
            this.mainChart.destroy();
            this.mainChart = null;
        }
        if (this.miniChart) {
            this.miniChart.destroy();
            this.miniChart = null;
        }
    }
}

// 전역 인스턴스 생성
const logGraphManager = new LogGraphManager();
