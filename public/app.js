/**
 * Main Application Controller
 * Handles user interactions and API communication
 */

// API Configuration
const API_BASE_URL = '/api';

// Initialize shape engines
const desktopEngine = new ShapeEngine('desktop-canvas');
const mobileEngine = new ShapeEngine('mobile-canvas');

// Application state
let currentShapeType = 'triangle';
let drawingMode = false;
let tempVertices = [];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadSavedShapes();
    loadUserPreferences();
    createSampleShape(); // Create initial sample
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Shape type selector
    document.getElementById('shape-type').addEventListener('change', (e) => {
        currentShapeType = e.target.value;
        if (currentShapeType !== 'custom') {
            drawingMode = false;
        }
    });

    // Checkbox controls
    document.getElementById('show-parallel').addEventListener('change', (e) => {
        desktopEngine.setSettings({ showParallel: e.target.checked });
        mobileEngine.setSettings({ showParallel: e.target.checked });
        desktopEngine.generateGuideLines();
        mobileEngine.generateGuideLines();
        renderBothCanvases();
    });

    document.getElementById('show-perpendicular').addEventListener('change', (e) => {
        desktopEngine.setSettings({ showPerpendicular: e.target.checked });
        mobileEngine.setSettings({ showPerpendicular: e.target.checked });
        desktopEngine.generateGuideLines();
        mobileEngine.generateGuideLines();
        renderBothCanvases();
    });

    document.getElementById('show-labels').addEventListener('change', (e) => {
        desktopEngine.setSettings({ showLabels: e.target.checked });
        mobileEngine.setSettings({ showLabels: e.target.checked });
        renderBothCanvases();
    });

    // Buttons
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('save-btn').addEventListener('click', saveShape);

    // Desktop canvas interactions
    const desktopCanvas = document.getElementById('desktop-canvas');
    desktopCanvas.addEventListener('click', handleCanvasClick);
    desktopCanvas.addEventListener('dblclick', handleCanvasDoubleClick);
}

/**
 * Handle canvas click for drawing shapes
 */
function handleCanvasClick(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentShapeType === 'custom') {
        // Custom drawing mode
        tempVertices.push({ x, y });
        desktopEngine.setVertices(tempVertices);
        renderDesktop();
    } else {
        // Predefined shapes
        const size = 80;
        desktopEngine.createPredefinedShape(currentShapeType, x, y, size);
        syncToMobile();
        renderBothCanvases();
    }
}

/**
 * Handle double-click to finish custom shape
 */
function handleCanvasDoubleClick(e) {
    if (currentShapeType === 'custom' && tempVertices.length >= 3) {
        desktopEngine.setVertices(tempVertices);
        syncToMobile();
        renderBothCanvases();
        tempVertices = [];
    }
}

/**
 * Clear canvas
 */
function clearCanvas() {
    desktopEngine.reset();
    mobileEngine.reset();
    tempVertices = [];
    renderBothCanvases();
}

/**
 * Render desktop canvas
 */
function renderDesktop() {
    desktopEngine.render();
}

/**
 * Render mobile canvas
 */
function renderMobile() {
    mobileEngine.render();
}

/**
 * Render both canvases
 */
function renderBothCanvases() {
    renderDesktop();
    renderMobile();
}

/**
 * Sync shape from desktop to mobile
 */
function syncToMobile() {
    const vertices = desktopEngine.getVertices();
    if (vertices.length > 0) {
        mobileEngine.setVertices(vertices);
        mobileEngine.scaleToFit(320, 520);
    }
}

/**
 * Create sample shape
 */
function createSampleShape() {
    desktopEngine.createPredefinedShape('triangle', 400, 300, 100);
    syncToMobile();
    renderBothCanvases();
}

/**
 * Save shape to database
 */
async function saveShape() {
    const vertices = desktopEngine.getVertices();

    if (vertices.length < 2) {
        showMessage('도형을 먼저 그려주세요!', 'error');
        return;
    }

    const shapeName = prompt('도형 이름을 입력하세요:', `도형 ${new Date().toLocaleTimeString()}`);
    if (!shapeName) return;

    const data = {
        shape_name: shapeName,
        shape_type: currentShapeType,
        vertices: vertices,
        moodle_course_id: getMoodleCourseId(),
        moodle_activity_id: getMoodleActivityId()
    };

    try {
        showMessage('저장 중...', 'info');

        const response = await fetch(`${API_BASE_URL}/shapes.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage(`성공적으로 저장되었습니다! (보조선 ${result.guide_lines_generated}개 생성)`, 'success');
            loadSavedShapes();
        } else {
            showMessage('저장 실패: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('네트워크 오류: ' + error.message, 'error');
    }
}

/**
 * Load saved shapes from database
 */
async function loadSavedShapes() {
    try {
        const response = await fetch(`${API_BASE_URL}/shapes.php`);
        const result = await response.json();

        if (result.success) {
            displayShapesList(result.shapes);
        }
    } catch (error) {
        console.error('Failed to load shapes:', error);
    }
}

/**
 * Display shapes list
 */
function displayShapesList(shapes) {
    const container = document.getElementById('shapes-list');

    if (shapes.length === 0) {
        container.innerHTML = '<p style="color: #6c757d;">저장된 도형이 없습니다.</p>';
        return;
    }

    container.innerHTML = shapes.map(shape => `
        <div class="shape-card" data-shape-id="${shape.id}">
            <h4>${shape.shape_name}</h4>
            <p>유형: ${getShapeTypeKorean(shape.shape_type)}</p>
            <p>꼭짓점: ${shape.vertices.length}개</p>
            <p>${new Date(shape.created_at).toLocaleString()}</p>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.shape-card').forEach(card => {
        card.addEventListener('click', () => {
            loadShape(card.dataset.shapeId);
        });
    });
}

/**
 * Load specific shape
 */
async function loadShape(shapeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/shapes.php?id=${shapeId}`);
        const result = await response.json();

        if (result.success) {
            const shape = result.shape;
            desktopEngine.setVertices(shape.vertices);
            syncToMobile();
            renderBothCanvases();
            showMessage(`"${shape.shape_name}" 불러오기 완료`, 'success');
        }
    } catch (error) {
        showMessage('도형 불러오기 실패: ' + error.message, 'error');
    }
}

/**
 * Load user preferences
 */
async function loadUserPreferences() {
    try {
        const response = await fetch(`${API_BASE_URL}/preferences.php`);
        const result = await response.json();

        if (result.success) {
            const prefs = result.preferences;

            document.getElementById('show-parallel').checked = prefs.auto_generate_parallel;
            document.getElementById('show-perpendicular').checked = prefs.auto_generate_perpendicular;
            document.getElementById('show-labels').checked = prefs.show_labels;

            desktopEngine.setSettings({
                showParallel: prefs.auto_generate_parallel,
                showPerpendicular: prefs.auto_generate_perpendicular,
                showLabels: prefs.show_labels,
                parallelColor: prefs.parallel_line_color,
                perpendicularColor: prefs.perpendicular_line_color,
                lineThickness: prefs.line_thickness
            });

            mobileEngine.setSettings({
                showParallel: prefs.auto_generate_parallel,
                showPerpendicular: prefs.auto_generate_perpendicular,
                showLabels: prefs.show_labels,
                parallelColor: prefs.parallel_line_color,
                perpendicularColor: prefs.perpendicular_line_color,
                lineThickness: prefs.line_thickness
            });
        }
    } catch (error) {
        console.error('Failed to load preferences:', error);
    }
}

/**
 * Get Moodle course ID from URL or session
 */
function getMoodleCourseId() {
    // Try to get from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course_id');

    // Or try to get from Moodle session if integrated
    if (typeof M !== 'undefined' && M.cfg && M.cfg.courseId) {
        return M.cfg.courseId;
    }

    return courseId || null;
}

/**
 * Get Moodle activity ID
 */
function getMoodleActivityId() {
    const urlParams = new URLSearchParams(window.location.search);
    const activityId = urlParams.get('activity_id');

    if (typeof M !== 'undefined' && M.cfg && M.cfg.cmid) {
        return M.cfg.cmid;
    }

    return activityId || null;
}

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
    // Remove existing message
    const existing = document.querySelector('.message');
    if (existing) {
        existing.remove();
    }

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert after control panel
    const controlPanel = document.querySelector('.control-panel');
    controlPanel.parentNode.insertBefore(message, controlPanel.nextSibling);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        message.remove();
    }, 4000);
}

/**
 * Get Korean name for shape type
 */
function getShapeTypeKorean(type) {
    const types = {
        'triangle': '삼각형',
        'quadrilateral': '사각형',
        'polygon': '다각형',
        'circle': '원',
        'line': '선분',
        'custom': '사용자 정의'
    };
    return types[type] || type;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveShape();
    }

    // Ctrl/Cmd + D to clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        clearCanvas();
    }

    // Escape to cancel custom drawing
    if (e.key === 'Escape' && currentShapeType === 'custom') {
        tempVertices = [];
        desktopEngine.reset();
        mobileEngine.reset();
        renderBothCanvases();
    }
});

// Export for Moodle integration
if (typeof window !== 'undefined') {
    window.ShapeGuideApp = {
        desktopEngine,
        mobileEngine,
        saveShape,
        loadShape,
        clearCanvas,
        getMoodleCourseId,
        getMoodleActivityId
    };
}
