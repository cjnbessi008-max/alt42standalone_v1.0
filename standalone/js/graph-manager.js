/**
 * Graph Manager with Area Color
 * Chart.js를 사용한 로그 스케일 그래프 with Area Fill
 */

class GraphManager {
    constructor() {
        this.mainChart = null;
        this.miniChart = null;
        this.colors = {
            primary: {
                border: 'rgba(102, 126, 234, 1)',
                background: 'rgba(102, 126, 234, 0.3)'
            },
            secondary: {
                border: 'rgba(118, 75, 162, 1)',
                background: 'rgba(118, 75, 162, 0.3)'
            },
            success: {
                border: 'rgba(40, 167, 69, 1)',
                background: 'rgba(40, 167, 69, 0.2)'
            }
        };
    }

    /**
     * 메인 진행도 그래프 초기화 (로그 스케일 + Area Color)
     */
    initMainChart() {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        const graphData = analytics.generateGraphData('week');

        const labels = graphData.map(d => d.label);
        const scores = graphData.map(d => d.score);

        this.mainChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '정답률 (%)',
                    data: scores,
                    borderColor: this.colors.primary.border,
                    backgroundColor: this.colors.primary.background, // Area Color
                    borderWidth: 3,
                    fill: true, // 영역 채우기 활성화
                    tension: 0.4, // 부드러운 곡선
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.primary.border,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary.border,
                    pointHoverBorderWidth: 3
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
                                family: "'Noto Sans KR', sans-serif",
                                weight: '600'
                            },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 15,
                            family: "'Noto Sans KR', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            family: "'Noto Sans KR', sans-serif"
                        },
                        padding: 15,
                        cornerRadius: 10,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const data = graphData[index];
                                return [
                                    `정답률: ${context.parsed.y.toFixed(1)}%`,
                                    `정답: ${data.correct}/${data.total}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'logarithmic', // 로그 스케일
                        min: 1,
                        max: 100,
                        title: {
                            display: true,
                            text: '정답률 (%)',
                            font: {
                                size: 14,
                                family: "'Noto Sans KR', sans-serif",
                                weight: '600'
                            },
                            padding: 10
                        },
                        ticks: {
                            callback: function(value) {
                                // 로그 스케일에서 읽기 쉬운 값만 표시
                                if (value === 1 || value === 10 || value === 100) {
                                    return value + '%';
                                }
                                if (value === 25 || value === 50 || value === 75) {
                                    return value + '%';
                                }
                                return '';
                            },
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '날짜',
                            font: {
                                size: 14,
                                family: "'Noto Sans KR', sans-serif",
                                weight: '600'
                            },
                            padding: 10
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * 미니 그래프 초기화 (스마트폰용)
     */
    initMiniChart() {
        const canvas = document.getElementById('miniChart');
        if (!canvas) return;

        const graphData = analytics.generateGraphData('week');
        const recentData = graphData.slice(-5); // 최근 5개만

        const labels = recentData.map(d => d.label);
        const scores = recentData.map(d => d.score);

        this.miniChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '정답률',
                    data: scores,
                    borderColor: this.colors.secondary.border,
                    backgroundColor: this.colors.secondary.background, // Area Color
                    borderWidth: 2,
                    fill: true, // 영역 채우기
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: this.colors.secondary.border,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1
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
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'logarithmic',
                        min: 1,
                        max: 100,
                        display: true,
                        ticks: {
                            callback: function(value) {
                                if (value === 1 || value === 10 || value === 100) {
                                    return value;
                                }
                                return '';
                            },
                            font: {
                                size: 10
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
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }

    /**
     * 그래프 업데이트
     */
    updateCharts() {
        const graphData = analytics.generateGraphData('week');

        // 메인 차트 업데이트
        if (this.mainChart) {
            this.mainChart.data.labels = graphData.map(d => d.label);
            this.mainChart.data.datasets[0].data = graphData.map(d => d.score);
            this.mainChart.update('none');
        }

        // 미니 차트 업데이트
        if (this.miniChart) {
            const recentData = graphData.slice(-5);
            this.miniChart.data.labels = recentData.map(d => d.label);
            this.miniChart.data.datasets[0].data = recentData.map(d => d.score);
            this.miniChart.update('none');
        }
    }

    /**
     * 실시간 데이터 포인트 추가
     */
    addDataPoint(label, value) {
        if (this.mainChart) {
            this.mainChart.data.labels.push(label);
            this.mainChart.data.datasets[0].data.push(Math.max(value, 1));

            // 최대 30개 데이터 포인트 유지
            if (this.mainChart.data.labels.length > 30) {
                this.mainChart.data.labels.shift();
                this.mainChart.data.datasets[0].data.shift();
            }

            this.mainChart.update('active');
        }

        if (this.miniChart) {
            this.miniChart.data.labels.push(label);
            this.miniChart.data.datasets[0].data.push(Math.max(value, 1));

            // 최대 10개 데이터 포인트 유지
            if (this.miniChart.data.labels.length > 10) {
                this.miniChart.data.labels.shift();
                this.miniChart.data.datasets[0].data.shift();
            }

            this.miniChart.update('active');
        }
    }

    /**
     * 비교 데이터셋 추가
     */
    addComparisonDataset(label, data, colorScheme = 'success') {
        if (!this.mainChart) return;

        const color = this.colors[colorScheme] || this.colors.primary;

        const newDataset = {
            label: label,
            data: data,
            borderColor: color.border,
            backgroundColor: color.background,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: color.border,
            borderDash: [5, 5] // 점선
        };

        this.mainChart.data.datasets.push(newDataset);
        this.mainChart.update();
    }

    /**
     * Area Color 토글
     */
    toggleAreaFill(enable) {
        if (this.mainChart) {
            this.mainChart.data.datasets.forEach(dataset => {
                dataset.fill = enable;
                if (!enable) {
                    dataset.backgroundColor = 'transparent';
                } else {
                    // 원래 색상 복원
                    dataset.backgroundColor = this.colors.primary.background;
                }
            });
            this.mainChart.update();
        }

        if (this.miniChart) {
            this.miniChart.data.datasets.forEach(dataset => {
                dataset.fill = enable;
                if (!enable) {
                    dataset.backgroundColor = 'transparent';
                } else {
                    dataset.backgroundColor = this.colors.secondary.background;
                }
            });
            this.miniChart.update();
        }
    }

    /**
     * 색상 변경
     */
    changeColor(colorScheme = 'primary') {
        if (!this.colors[colorScheme]) return;

        const color = this.colors[colorScheme];

        if (this.mainChart) {
            const dataset = this.mainChart.data.datasets[0];
            dataset.borderColor = color.border;
            dataset.backgroundColor = color.background;
            dataset.pointBackgroundColor = color.border;
            dataset.pointHoverBorderColor = color.border;
            this.mainChart.update();
        }
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

    /**
     * 그래프 데이터 내보내기
     */
    exportGraphData() {
        if (!this.mainChart) return null;

        return {
            labels: this.mainChart.data.labels,
            datasets: this.mainChart.data.datasets.map(ds => ({
                label: ds.label,
                data: ds.data
            }))
        };
    }
}

// 전역 인스턴스 생성
const graphManager = new GraphManager();
