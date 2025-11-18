// This file is part of Moodle - http://moodle.org/
//
// Anxiety Detection Dashboard JavaScript
//
// @package    local_anxiety
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

define(['jquery', 'core/ajax'], function($, Ajax) {

    var Dashboard = {
        config: {
            currentUserid: 0,
            courseid: 0,
            viewUserid: null,
            timerange: 'week',
            sesskey: ''
        },

        charts: {
            trend: null,
            distribution: null
        },

        init: function(currentUserid, courseid, viewUserid, timerange, sesskey) {
            this.config.currentUserid = currentUserid;
            this.config.courseid = courseid;
            this.config.viewUserid = viewUserid;
            this.config.timerange = timerange;
            this.config.sesskey = sesskey;

            // Load data
            this.loadData();

            // Timerange selector
            $('#timerange-select').on('change', function() {
                var newTimerange = $(this).val();
                window.location.href = M.cfg.wwwroot + '/local/anxiety/dashboard.php' +
                    '?courseid=' + courseid +
                    (viewUserid ? '&userid=' + viewUserid : '') +
                    '&timerange=' + newTimerange;
            });

            // Auto-refresh every 60 seconds
            setInterval(this.loadData.bind(this), 60000);
        },

        loadData: function() {
            var self = this;

            $.ajax({
                url: M.cfg.wwwroot + '/local/anxiety/ajax/get_data.php',
                method: 'GET',
                data: {
                    sesskey: this.config.sesskey,
                    courseid: this.config.courseid,
                    userid: this.config.viewUserid,
                    timerange: this.config.timerange
                },
                dataType: 'json',
                success: function(data) {
                    if (data.success) {
                        if (data.students) {
                            // Teacher view
                            self.renderTeacherView(data);
                        } else {
                            // Student view
                            self.renderStudentView(data);
                        }
                    } else {
                        console.error('Failed to load data:', data.error);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error:', error);
                }
            });
        },

        renderTeacherView: function(data) {
            var self = this;

            // Render alerts
            var alertsHtml = '';
            $('#alerts-loading').hide();

            if (data.alerts && data.alerts.length > 0) {
                data.alerts.forEach(function(alert) {
                    var levelClass = 'anxiety-level-' + alert.alert_type;
                    var acknowledgedClass = alert.is_read ? ' acknowledged' : '';

                    alertsHtml += '<div class="anxiety-alert-item' + acknowledgedClass + '" data-alertid="' + alert.id + '">';
                    alertsHtml += '<strong>' + alert.student_name + '</strong> ';
                    alertsHtml += '<span class="anxiety-level-badge ' + levelClass + '">' + alert.alert_type.toUpperCase() + '</span>';
                    alertsHtml += '<span class="float-right">' + self.formatDate(alert.timecreated) + '</span>';
                    alertsHtml += '<p>' + alert.message + '</p>';
                    if (!alert.is_read) {
                        alertsHtml += '<button class="btn btn-sm btn-primary acknowledge-btn" data-alertid="' + alert.id + '">Acknowledge</button>';
                    }
                    alertsHtml += '</div>';
                });
            } else {
                alertsHtml = '<p class="text-muted">No recent alerts</p>';
            }
            $('#alerts-container').html(alertsHtml);

            // Attach acknowledge handlers
            $('.acknowledge-btn').on('click', function() {
                var alertid = $(this).data('alertid');
                self.acknowledgeAlert(alertid);
            });

            // Render students table
            var studentsHtml = '';
            $('#students-loading').hide();

            if (data.students && data.students.length > 0) {
                studentsHtml += '<table class="anxiety-table">';
                studentsHtml += '<thead><tr>';
                studentsHtml += '<th>Student</th>';
                studentsHtml += '<th>Current Anxiety Level</th>';
                studentsHtml += '<th>Score</th>';
                studentsHtml += '<th>Action</th>';
                studentsHtml += '</tr></thead>';
                studentsHtml += '<tbody>';

                data.students.forEach(function(student) {
                    var levelClass = 'anxiety-level-' + student.anxiety_level;
                    studentsHtml += '<tr>';
                    studentsHtml += '<td>' + student.name + '</td>';
                    studentsHtml += '<td><span class="anxiety-level-badge ' + levelClass + '">' + student.anxiety_level + '</span></td>';
                    studentsHtml += '<td>' + student.anxiety_score + '</td>';
                    studentsHtml += '<td><a href="?courseid=' + self.config.courseid + '&userid=' + student.id + '&timerange=' + self.config.timerange + '">View Details</a></td>';
                    studentsHtml += '</tr>';
                });

                studentsHtml += '</tbody></table>';
            } else {
                studentsHtml = '<p class="text-muted">No student data available</p>';
            }
            $('#students-container').html(studentsHtml);

            // Render distribution chart
            if (data.alert_stats) {
                this.renderDistributionChart(data.alert_stats, data.students);
            }
        },

        renderStudentView: function(data) {
            // Render current status
            $('#status-loading').hide();

            if (data.trend && data.trend.length > 0) {
                var latest = data.trend[data.trend.length - 1];
                var levelClass = 'anxiety-level-' + latest.level;

                var statusHtml = '<div class="anxiety-current-score">';
                statusHtml += '<h2>' + latest.score + '</h2>';
                statusHtml += '<p><span class="anxiety-level-badge ' + levelClass + '">' + latest.level + '</span></p>';
                statusHtml += '<p class="text-muted">Last updated: ' + this.formatDate(latest.timestamp) + '</p>';
                statusHtml += '</div>';

                $('#status-container').html(statusHtml);
            } else {
                $('#status-container').html('<p class="text-muted">No data available yet</p>');
            }

            // Render trend chart
            if (data.trend && data.trend.length > 0) {
                this.renderTrendChart(data.trend);
            }
        },

        renderTrendChart: function(trend) {
            var ctx = document.getElementById('anxiety-trend-chart');
            if (!ctx) return;

            var labels = trend.map(function(item) {
                return new Date(item.timestamp * 1000).toLocaleDateString();
            });

            var scores = trend.map(function(item) {
                return item.score;
            });

            // Destroy existing chart
            if (this.charts.trend) {
                this.charts.trend.destroy();
            }

            this.charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Anxiety Score',
                        data: scores,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                max: 100
                            }
                        }]
                    },
                    annotation: {
                        annotations: [{
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y-axis-0',
                            value: 30,
                            borderColor: 'yellow',
                            borderWidth: 2,
                            label: {
                                content: 'Mild',
                                enabled: true
                            }
                        }, {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y-axis-0',
                            value: 50,
                            borderColor: 'orange',
                            borderWidth: 2,
                            label: {
                                content: 'Moderate',
                                enabled: true
                            }
                        }, {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y-axis-0',
                            value: 70,
                            borderColor: 'red',
                            borderWidth: 2,
                            label: {
                                content: 'Severe',
                                enabled: true
                            }
                        }]
                    }
                }
            });
        },

        renderDistributionChart: function(stats, students) {
            var ctx = document.getElementById('anxiety-chart');
            if (!ctx) return;

            // Count students by anxiety level
            var levelCounts = {
                normal: 0,
                mild: 0,
                moderate: 0,
                severe: 0
            };

            students.forEach(function(student) {
                levelCounts[student.anxiety_level] = (levelCounts[student.anxiety_level] || 0) + 1;
            });

            // Destroy existing chart
            if (this.charts.distribution) {
                this.charts.distribution.destroy();
            }

            this.charts.distribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Normal', 'Mild', 'Moderate', 'Severe'],
                    datasets: [{
                        data: [
                            levelCounts.normal,
                            levelCounts.mild,
                            levelCounts.moderate,
                            levelCounts.severe
                        ],
                        backgroundColor: [
                            '#28a745',
                            '#ffc107',
                            '#ff9800',
                            '#dc3545'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    legend: {
                        position: 'bottom'
                    }
                }
            });
        },

        acknowledgeAlert: function(alertid) {
            var self = this;

            $.ajax({
                url: M.cfg.wwwroot + '/local/anxiety/ajax/acknowledge_alert.php',
                method: 'POST',
                data: {
                    sesskey: this.config.sesskey,
                    alertid: alertid
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        // Reload data
                        self.loadData();
                    } else {
                        alert('Failed to acknowledge alert: ' + response.error);
                    }
                },
                error: function(xhr, status, error) {
                    alert('AJAX error: ' + error);
                }
            });
        },

        formatDate: function(timestamp) {
            var date = new Date(timestamp * 1000);
            return date.toLocaleString();
        }
    };

    return {
        init: function(currentUserid, courseid, viewUserid, timerange, sesskey) {
            $(document).ready(function() {
                Dashboard.init(currentUserid, courseid, viewUserid, timerange, sesskey);
            });
        }
    };
});
