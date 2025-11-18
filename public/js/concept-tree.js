// Concept Tree Visualization Engine
class ConceptTree {
    constructor(containerId, svgId) {
        this.container = document.getElementById(containerId);
        this.svg = document.getElementById(svgId);
        this.width = 296; // Phone screen width
        this.height = 500;
        this.nodes = [];
        this.links = [];
        this.currentData = null;
    }

    /**
     * Show the concept tree container
     */
    show() {
        this.container.classList.add('active');
    }

    /**
     * Hide the concept tree container
     */
    hide() {
        this.container.classList.remove('active');
        this.clear();
    }

    /**
     * Clear the SVG canvas
     */
    clear() {
        // Remove all child elements except defs
        const children = Array.from(this.svg.children);
        children.forEach(child => {
            if (child.tagName !== 'defs') {
                child.remove();
            }
        });
        this.nodes = [];
        this.links = [];
    }

    /**
     * Render concept tree from data
     * @param {object} treeData - Tree data from API
     */
    async render(treeData) {
        this.show();
        this.clear();
        this.currentData = treeData;

        if (!treeData.concepts || treeData.concepts.length === 0) {
            this.showEmptyState();
            return;
        }

        // Show loading
        this.showLoading();

        // Simulate loading delay for smooth animation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Hide loading
        this.hideLoading();

        // Calculate layout
        const layout = this.calculateLayout(treeData);

        // Draw branches first (so they appear behind nodes)
        this.drawBranches(layout.links);

        // Draw nodes
        this.drawNodes(layout.nodes);

        // Add legend
        this.drawLegend();
    }

    /**
     * Calculate node positions using tree layout
     * @param {object} treeData - Tree data
     * @returns {object} Layout with nodes and links
     */
    calculateLayout(treeData) {
        const nodes = [];
        const links = [];
        const centerX = this.width / 2;
        const startY = 80;
        const levelGap = 90;

        // Root node (the selected number)
        const rootNode = {
            id: 'root',
            x: centerX,
            y: startY,
            label: `${treeData.number}`,
            description: `Number ${treeData.number}`,
            level: 0,
            type: 'root'
        };
        nodes.push(rootNode);

        // Process concepts (level 1)
        treeData.concepts.forEach((concept, index) => {
            const angle = (index / treeData.concepts.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 100;
            const x = centerX + Math.cos(angle) * radius;
            const y = startY + levelGap + Math.sin(angle) * 50;

            const node = {
                id: `concept-${concept.id}`,
                x: x,
                y: y,
                label: this.truncate(concept.name, 15),
                description: concept.description,
                level: 1,
                type: 'concept',
                data: concept
            };
            nodes.push(node);

            links.push({
                source: rootNode,
                target: node
            });

            // Process children (level 2)
            if (concept.children && concept.children.length > 0) {
                concept.children.forEach((child, childIndex) => {
                    const childAngle = angle + (childIndex - (concept.children.length - 1) / 2) * 0.5;
                    const childRadius = 70;
                    const childX = x + Math.cos(childAngle) * childRadius;
                    const childY = y + levelGap * 0.8;

                    const childNode = {
                        id: `child-${child.id}`,
                        x: childX,
                        y: childY,
                        label: this.truncate(child.name, 12),
                        description: child.description,
                        level: 2,
                        type: 'child',
                        data: child
                    };
                    nodes.push(childNode);

                    links.push({
                        source: node,
                        target: childNode
                    });
                });
            }
        });

        return { nodes, links };
    }

    /**
     * Draw branches (lines connecting nodes)
     * @param {array} links - Array of link objects
     */
    drawBranches(links) {
        links.forEach((link, index) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            // Create curved path
            const midX = (link.source.x + link.target.x) / 2;
            const midY = (link.source.y + link.target.y) / 2;

            const d = `M ${link.source.x} ${link.source.y} Q ${midX} ${midY} ${link.target.x} ${link.target.y}`;

            path.setAttribute('d', d);
            path.setAttribute('class', 'tree-branch animating');
            path.style.animationDelay = `${index * 0.1}s`;

            this.svg.appendChild(path);
        });
    }

    /**
     * Draw nodes (circles with text)
     * @param {array} nodes - Array of node objects
     */
    drawNodes(nodes) {
        nodes.forEach((node, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', `tree-node ${node.type} level-${node.level}`);
            group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            group.style.animationDelay = `${index * 0.15}s`;

            // Circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', node.level === 0 ? 35 : node.level === 1 ? 28 : 22);
            circle.setAttribute('cx', 0);
            circle.setAttribute('cy', 0);

            // Text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.textContent = node.label;
            text.setAttribute('dy', '0.35em');
            text.setAttribute('font-size', node.level === 0 ? '16' : node.level === 1 ? '11' : '10');

            // Add hover event
            group.addEventListener('click', () => {
                this.showNodeInfo(node, group);
            });

            group.appendChild(circle);
            group.appendChild(text);
            this.svg.appendChild(group);

            this.nodes.push({ element: group, data: node });
        });
    }

    /**
     * Show node information on click
     * @param {object} node - Node data
     * @param {element} element - SVG element
     */
    showNodeInfo(node, element) {
        // Remove existing info boxes
        const existingInfo = this.container.querySelector('.concept-info');
        if (existingInfo) {
            existingInfo.remove();
        }

        // Create info box
        const infoBox = document.createElement('div');
        infoBox.className = 'concept-info visible';
        infoBox.innerHTML = `
            <h4>${node.label}</h4>
            <p>${node.description || '개념 설명이 없습니다.'}</p>
            <span class="concept-level">Level ${node.level}</span>
        `;

        // Position near the node
        const rect = element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        infoBox.style.left = `${rect.left - containerRect.left + 50}px`;
        infoBox.style.top = `${rect.top - containerRect.top}px`;

        this.container.appendChild(infoBox);

        // Remove after 3 seconds
        setTimeout(() => {
            infoBox.classList.remove('visible');
            setTimeout(() => infoBox.remove(), 300);
        }, 3000);
    }

    /**
     * Draw legend
     */
    drawLegend() {
        const legend = document.createElement('div');
        legend.className = 'tree-legend';
        legend.innerHTML = `
            <div class="tree-legend-item">
                <div class="tree-legend-color" style="background: #f093fb;"></div>
                <span>선택한 숫자</span>
            </div>
            <div class="tree-legend-item">
                <div class="tree-legend-color" style="background: #667eea;"></div>
                <span>주요 개념</span>
            </div>
            <div class="tree-legend-item">
                <div class="tree-legend-color" style="background: #4facfe;"></div>
                <span>하위 개념</span>
            </div>
        `;
        this.container.appendChild(legend);
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'tree-loading';
        loading.innerHTML = `
            <div class="tree-loading-spinner"></div>
            <div>개념 트리를 불러오는 중...</div>
        `;
        this.container.appendChild(loading);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = this.container.querySelector('.tree-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        this.hideLoading();
        const empty = document.createElement('div');
        empty.className = 'tree-empty';
        empty.innerHTML = `
            <div class="tree-empty-icon">🌳</div>
            <div class="tree-empty-text">이 숫자와 관련된 개념이 없습니다</div>
        `;
        this.container.appendChild(empty);
    }

    /**
     * Truncate text to max length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

// Create global concept tree instance
const conceptTree = new ConceptTree('concept-tree-container', 'tree-svg');
