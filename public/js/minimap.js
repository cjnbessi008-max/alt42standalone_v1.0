/**
 * Set MiniMap Visualization
 * Renders set structures in various layouts
 */

// MiniMap State
const MiniMapState = {
    container: null,
    svg: null,
    width: 0,
    height: 0,
    nodes: [],
    links: [],
    transform: { x: 0, y: 0, scale: 1 },
    selectedNodeId: null
};

/**
 * Initialize MiniMap
 */
function initMiniMap(sets, relationships) {
    MiniMapState.container = document.getElementById('minimapSvg');

    // Get container dimensions
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Create SVG
    createSVG();

    // Process data
    processData(sets, relationships);

    // Render initial layout
    renderLayout('tree');

    console.log('MiniMap initialized');
}

/**
 * Update container dimensions
 */
function updateDimensions() {
    const rect = MiniMapState.container.getBoundingClientRect();
    MiniMapState.width = rect.width;
    MiniMapState.height = rect.height;
}

/**
 * Create SVG element
 */
function createSVG() {
    MiniMapState.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    MiniMapState.svg.setAttribute('width', '100%');
    MiniMapState.svg.setAttribute('height', '100%');
    MiniMapState.svg.style.cursor = 'grab';

    // Create container group for transforms
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'minimap-main-group');
    MiniMapState.svg.appendChild(g);

    MiniMapState.container.appendChild(MiniMapState.svg);

    // Add pan and zoom
    addPanZoom();
}

/**
 * Process sets and relationships data
 */
function processData(sets, relationships) {
    MiniMapState.nodes = sets.map(set => ({
        id: set.id,
        name: set.name,
        color: set.color,
        x: set.position_x || 0,
        y: set.position_y || 0,
        problemsCount: set.problems_count || 0,
        parentId: set.parent_id
    }));

    MiniMapState.links = relationships.map(rel => ({
        source: rel.set_a_id,
        target: rel.set_b_id,
        type: rel.relationship_type
    }));
}

/**
 * Render layout
 */
function renderLayout(layoutType) {
    const mainGroup = document.getElementById('minimap-main-group');
    mainGroup.innerHTML = '';

    switch (layoutType) {
        case 'tree':
            renderTreeLayout(mainGroup);
            break;
        case 'venn':
            renderVennLayout(mainGroup);
            break;
        case 'network':
            renderNetworkLayout(mainGroup);
            break;
        case 'hierarchy':
            renderHierarchyLayout(mainGroup);
            break;
        default:
            renderTreeLayout(mainGroup);
    }
}

/**
 * Render Tree Layout
 */
function renderTreeLayout(container) {
    const nodes = MiniMapState.nodes;
    const links = MiniMapState.links;

    // Calculate positions
    const levelHeight = 120;
    const nodeSpacing = 150;

    // Group nodes by level (parent-child hierarchy)
    const levels = {};
    nodes.forEach(node => {
        let level = 0;
        let currentNode = node;

        while (currentNode.parentId) {
            level++;
            currentNode = nodes.find(n => n.id === currentNode.parentId);
            if (!currentNode || level > 10) break; // Prevent infinite loop
        }

        if (!levels[level]) levels[level] = [];
        levels[level].push(node);
    });

    // Position nodes
    const centerX = MiniMapState.width / 2;
    const startY = 80;

    Object.keys(levels).forEach(level => {
        const levelNodes = levels[level];
        const levelWidth = levelNodes.length * nodeSpacing;
        const startX = centerX - levelWidth / 2;

        levelNodes.forEach((node, index) => {
            node.x = startX + index * nodeSpacing + nodeSpacing / 2;
            node.y = startY + level * levelHeight;
        });
    });

    // Draw links first (so they appear behind nodes)
    links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);

        if (source && target) {
            drawLink(container, source, target, link.type);
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        drawNode(container, node);
    });
}

/**
 * Render Venn Diagram Layout
 */
function renderVennLayout(container) {
    const nodes = MiniMapState.nodes;
    const centerX = MiniMapState.width / 2;
    const centerY = MiniMapState.height / 2;

    // Position nodes in circular pattern
    const radius = Math.min(MiniMapState.width, MiniMapState.height) / 3;
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
    });

    // Draw as circles with overlaps
    nodes.forEach(node => {
        drawVennCircle(container, node);
    });

    // Draw labels
    nodes.forEach(node => {
        drawNodeLabel(container, node);
    });
}

/**
 * Render Network Layout
 */
function renderNetworkLayout(container) {
    const nodes = MiniMapState.nodes;
    const links = MiniMapState.links;

    // Simple force-directed layout simulation
    const centerX = MiniMapState.width / 2;
    const centerY = MiniMapState.height / 2;

    // Initialize positions randomly
    nodes.forEach(node => {
        if (!node.x || node.x === 0) {
            node.x = centerX + (Math.random() - 0.5) * 200;
            node.y = centerY + (Math.random() - 0.5) * 200;
        }
    });

    // Draw links
    links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);

        if (source && target) {
            drawLink(container, source, target, link.type);
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        drawNode(container, node);
    });
}

/**
 * Render Hierarchy Layout
 */
function renderHierarchyLayout(container) {
    // Similar to tree but with different spacing
    renderTreeLayout(container);
}

/**
 * Draw Link
 */
function drawLink(container, source, target, type) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', source.x);
    line.setAttribute('y1', source.y);
    line.setAttribute('x2', target.x);
    line.setAttribute('y2', target.y);
    line.setAttribute('class', `relationship-line relationship-${type}`);

    container.appendChild(line);
}

/**
 * Draw Node
 */
function drawNode(container, node) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'set-node');
    group.setAttribute('data-node-id', node.id);
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

    // Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', 40);
    circle.setAttribute('fill', node.color);
    group.appendChild(circle);

    // Name
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('y', -5);
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '14');
    text.textContent = node.name;
    group.appendChild(text);

    // Problem count
    const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    countText.setAttribute('y', 10);
    countText.setAttribute('fill', 'white');
    countText.setAttribute('font-size', '12');
    countText.textContent = `${node.problemsCount}문제`;
    group.appendChild(countText);

    // Click event
    group.style.cursor = 'pointer';
    group.addEventListener('click', () => {
        const appState = getAppState();
        const set = appState.sets.find(s => s.id === node.id);
        if (set) {
            // Trigger set selection through a custom event
            const event = new CustomEvent('setSelected', { detail: set });
            document.dispatchEvent(event);
        }
    });

    container.appendChild(group);
}

/**
 * Draw Venn Circle
 */
function drawVennCircle(container, node) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', 60);
    circle.setAttribute('fill', node.color);
    circle.setAttribute('opacity', '0.5');
    circle.setAttribute('stroke', node.color);
    circle.setAttribute('stroke-width', '3');
    circle.setAttribute('class', 'set-node');

    container.appendChild(circle);
}

/**
 * Draw Node Label
 */
function drawNodeLabel(container, node) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', node.color);
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-size', '14');
    text.textContent = node.name;

    container.appendChild(text);
}

/**
 * Add Pan and Zoom functionality
 */
function addPanZoom() {
    let isDragging = false;
    let startX, startY;

    MiniMapState.svg.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - MiniMapState.transform.x;
        startY = e.clientY - MiniMapState.transform.y;
        MiniMapState.svg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        MiniMapState.transform.x = e.clientX - startX;
        MiniMapState.transform.y = e.clientY - startY;

        updateTransform();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        MiniMapState.svg.style.cursor = 'grab';
    });

    // Zoom with mouse wheel
    MiniMapState.svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        MiniMapState.transform.scale = Math.max(0.5, Math.min(2, MiniMapState.transform.scale + delta));
        updateTransform();
    });
}

/**
 * Update SVG transform
 */
function updateTransform() {
    const mainGroup = document.getElementById('minimap-main-group');
    if (mainGroup) {
        const { x, y, scale } = MiniMapState.transform;
        mainGroup.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
    }
}

/**
 * Update MiniMap Layout (called from app.js)
 */
function updateMiniMapLayout(layoutType) {
    renderLayout(layoutType);
}

/**
 * Zoom MiniMap (called from app.js)
 */
function zoomMiniMap(level) {
    MiniMapState.transform.scale = level;
    updateTransform();
}

/**
 * Reset MiniMap View (called from app.js)
 */
function resetMiniMapView() {
    MiniMapState.transform = { x: 0, y: 0, scale: 1 };
    updateTransform();
}

/**
 * Highlight Set in MiniMap (called from app.js)
 */
function highlightSetInMiniMap(setId) {
    // Remove previous highlight
    document.querySelectorAll('.set-node').forEach(node => {
        node.querySelector('circle').setAttribute('stroke-width', '3');
    });

    // Add highlight to selected node
    const node = document.querySelector(`.set-node[data-node-id="${setId}"]`);
    if (node) {
        const circle = node.querySelector('circle');
        circle.setAttribute('stroke-width', '6');
        circle.setAttribute('stroke', '#f39c12');
    }

    MiniMapState.selectedNodeId = setId;
}
