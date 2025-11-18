/**
 * ALT42 Graph Visualizer
 * Concept graph visualization with intersection detection
 */

class GraphNode {
    constructor(id, x, y, label, concept = '') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = label;
        this.concept = concept;
        this.radius = 30;
        this.color = this.generateColor();
        this.selected = false;
        this.dragging = false;
    }

    generateColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    draw(ctx) {
        ctx.save();

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Node circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = this.selected ? '#FFD700' : '#fff';
        ctx.lineWidth = this.selected ? 4 : 2;
        ctx.stroke();

        // Label
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y);

        ctx.restore();
    }
}

class GraphEdge {
    constructor(id, from, to, label = '') {
        this.id = id;
        this.from = from;
        this.to = to;
        this.label = label;
        this.color = '#4A90E2';
    }

    draw(ctx, nodes) {
        const fromNode = nodes.find(n => n.id === this.from);
        const toNode = nodes.find(n => n.id === this.to);

        if (!fromNode || !toNode) return;

        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Draw arrow
        this.drawArrow(ctx, fromNode, toNode);

        // Draw label
        if (this.label) {
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.label, midX, midY - 10);
        }

        ctx.restore();
    }

    drawArrow(ctx, from, to) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 15;
        const arrowWidth = 8;

        const endX = to.x - Math.cos(angle) * to.radius;
        const endY = to.y - Math.sin(angle) * to.radius;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    getLine(nodes) {
        const fromNode = nodes.find(n => n.id === this.from);
        const toNode = nodes.find(n => n.id === this.to);
        if (!fromNode || !toNode) return null;
        return {
            x1: fromNode.x, y1: fromNode.y,
            x2: toNode.x, y2: toNode.y
        };
    }
}

class GraphVisualizer {
    constructor(canvasId, burstEffect, meltEffect) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.burstEffect = burstEffect;
        this.meltEffect = meltEffect;

        this.nodes = [];
        this.edges = [];
        this.intersections = [];
        this.selectedNode = null;
        this.draggedNode = null;

        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;

        this.setupCanvas();
        this.setupEventListeners();
        this.initializeSampleGraph();
        this.animate();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        for (let node of this.nodes) {
            if (node.contains(pos.x, pos.y)) {
                this.draggedNode = node;
                node.dragging = true;
                break;
            }
        }
    }

    handleMouseMove(e) {
        if (this.draggedNode) {
            const pos = this.getMousePos(e);
            this.draggedNode.x = pos.x;
            this.draggedNode.y = pos.y;
            this.detectIntersections();
        }
    }

    handleMouseUp(e) {
        if (this.draggedNode) {
            this.draggedNode.dragging = false;
            this.draggedNode = null;
        }
    }

    handleClick(e) {
        const pos = this.getMousePos(e);
        let found = false;

        for (let node of this.nodes) {
            if (node.contains(pos.x, pos.y)) {
                node.selected = !node.selected;
                found = true;
                break;
            }
        }

        if (!found) {
            this.nodes.forEach(n => n.selected = false);
        }
    }

    addNode(x, y, label, concept = '') {
        const node = new GraphNode(this.nodeIdCounter++, x, y, label, concept);
        this.nodes.push(node);
        this.detectIntersections();
        return node;
    }

    addEdge(fromId, toId, label = '') {
        const edge = new GraphEdge(this.edgeIdCounter++, fromId, toId, label);
        this.edges.push(edge);
        this.detectIntersections();
        return edge;
    }

    removeNode(id) {
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
        this.detectIntersections();
    }

    clear() {
        this.nodes = [];
        this.edges = [];
        this.intersections = [];
        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;
    }

    detectIntersections() {
        const newIntersections = [];

        // Check all pairs of edges for intersections
        for (let i = 0; i < this.edges.length; i++) {
            for (let j = i + 1; j < this.edges.length; j++) {
                const line1 = this.edges[i].getLine(this.nodes);
                const line2 = this.edges[j].getLine(this.nodes);

                if (!line1 || !line2) continue;

                const intersection = this.lineIntersection(line1, line2);
                if (intersection) {
                    newIntersections.push({
                        x: intersection.x,
                        y: intersection.y,
                        edge1: this.edges[i],
                        edge2: this.edges[j]
                    });

                    // Create burst effect at new intersections
                    const isNew = !this.intersections.some(
                        int => Math.abs(int.x - intersection.x) < 5 &&
                               Math.abs(int.y - intersection.y) < 5
                    );

                    if (isNew) {
                        // Trigger burst effect
                        if (this.burstEffect) {
                            this.burstEffect.createBurst(intersection.x, intersection.y, '#FFD700');
                        }
                        // Trigger melt effect with warm colors
                        if (this.meltEffect) {
                            this.meltEffect.createMelt(intersection.x, intersection.y);
                        }
                    }
                }
            }
        }

        this.intersections = newIntersections;
    }

    lineIntersection(line1, line2) {
        const { x1, y1, x2, y2 } = line1;
        const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denominator) < 0.0001) return null; // Lines are parallel

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }

        return null;
    }

    drawIntersections() {
        this.intersections.forEach(intersection => {
            this.ctx.save();

            // Draw intersection point
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(intersection.x, intersection.y, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw highlight ring
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const pulseSize = 12 + Math.sin(Date.now() / 200) * 3;
            this.ctx.arc(intersection.x, intersection.y, pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw edges
        this.edges.forEach(edge => edge.draw(this.ctx, this.nodes));

        // Draw intersections
        this.drawIntersections();

        // Draw burst effect
        if (this.burstEffect) {
            this.burstEffect.draw(this.ctx);
        }

        // Draw melt effect (on top of burst for warm overlay)
        if (this.meltEffect) {
            this.meltEffect.draw(this.ctx);
        }

        // Draw nodes
        this.nodes.forEach(node => node.draw(this.ctx));
    }

    drawGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    animate() {
        if (this.burstEffect) {
            this.burstEffect.update();
        }
        if (this.meltEffect) {
            this.meltEffect.update();
        }
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    initializeSampleGraph() {
        // Create sample concept graph for mathematics
        const concepts = [
            { label: '분수', x: 0.2, y: 0.3, concept: 'fraction' },
            { label: '덧셈', x: 0.5, y: 0.2, concept: 'addition' },
            { label: '뺄셈', x: 0.8, y: 0.3, concept: 'subtraction' },
            { label: '분자', x: 0.3, y: 0.6, concept: 'numerator' },
            { label: '분모', x: 0.7, y: 0.6, concept: 'denominator' },
            { label: '통분', x: 0.5, y: 0.8, concept: 'common_denominator' }
        ];

        concepts.forEach(c => {
            this.addNode(
                c.x * this.canvas.width,
                c.y * this.canvas.height,
                c.label,
                c.concept
            );
        });

        // Add edges to create relationships
        this.addEdge(0, 3, '포함');  // 분수 -> 분자
        this.addEdge(0, 4, '포함');  // 분수 -> 분모
        this.addEdge(0, 1, '연산');  // 분수 -> 덧셈
        this.addEdge(0, 2, '연산');  // 분수 -> 뺄셈
        this.addEdge(1, 5, '필요');  // 덧셈 -> 통분
        this.addEdge(2, 5, '필요');  // 뺄셈 -> 통분
    }

    getStats() {
        return {
            nodeCount: this.nodes.length,
            edgeCount: this.edges.length,
            intersectionCount: this.intersections.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphVisualizer;
}
