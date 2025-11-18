/**
 * Configuration for Log Network Map
 */

const CONFIG = {
    // API Base URL
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost/log-network-map/backend/api'
        : '/backend/api',

    // API Endpoints
    ENDPOINTS: {
        NETWORK: '/network.php',
        CONCEPTS: '/concepts.php',
        LOGS: '/logs.php',
        MOODLE: '/moodle.php'
    },

    // Network Visualization Options
    NETWORK_OPTIONS: {
        hierarchical: {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'UD',
                    sortMethod: 'directed',
                    levelSeparation: 150,
                    nodeSpacing: 200
                }
            },
            physics: {
                enabled: false
            }
        },
        force: {
            layout: {
                randomSeed: 42
            },
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 200
                },
                barnesHut: {
                    gravitationalConstant: -8000,
                    springConstant: 0.04,
                    springLength: 150
                }
            }
        },
        circular: {
            layout: {
                randomSeed: 42,
                improvedLayout: true
            },
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 100
                }
            }
        }
    },

    // Node styling by difficulty level
    NODE_STYLES: {
        beginner: {
            color: '#3498db',
            label: '초급'
        },
        intermediate: {
            color: '#f39c12',
            label: '중급'
        },
        advanced: {
            color: '#e74c3c',
            label: '고급'
        }
    },

    // Edge styling by relationship type
    EDGE_STYLES: {
        prerequisite: {
            color: '#2ecc71',
            label: '선수학습'
        },
        related: {
            color: '#95a5a6',
            label: '관련'
        },
        extends: {
            color: '#9b59b6',
            label: '확장'
        },
        applies: {
            color: '#1abc9c',
            label: '적용'
        }
    },

    // Default network configuration
    DEFAULT_NETWORK_CONFIG: {
        nodes: {
            shape: 'dot',
            size: 20,
            font: {
                size: 14,
                color: '#333',
                face: 'Segoe UI'
            },
            borderWidth: 2,
            borderWidthSelected: 4,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.2)',
                size: 10,
                x: 0,
                y: 0
            }
        },
        edges: {
            width: 2,
            color: {
                inherit: false
            },
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.8
                }
            },
            smooth: {
                type: 'continuous',
                roundness: 0.5
            },
            font: {
                size: 11,
                align: 'middle'
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            dragNodes: true,
            dragView: true,
            zoomView: true,
            navigationButtons: true,
            keyboard: true
        },
        manipulation: {
            enabled: false
        }
    },

    // Animation settings
    ANIMATION: {
        duration: 1000,
        easingFunction: 'easeInOutQuad'
    },

    // Refresh interval (ms)
    REFRESH_INTERVAL: 30000, // 30 seconds

    // Debug mode
    DEBUG: true
};

// Helper function to log debug messages
function debug(...args) {
    if (CONFIG.DEBUG) {
        console.log('[Log Network Map]', ...args);
    }
}

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}
