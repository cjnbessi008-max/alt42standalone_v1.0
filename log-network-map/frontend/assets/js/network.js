/**
 * Network Visualization Logic
 */

class NetworkVisualization {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.network = null;
        this.data = {
            nodes: new vis.DataSet([]),
            edges: new vis.DataSet([])
        };
        this.options = { ...CONFIG.DEFAULT_NETWORK_CONFIG, ...options };
        this.filters = {
            difficulties: ['beginner', 'intermediate', 'advanced'],
            showLearningPaths: false
        };
        this.currentLayout = 'hierarchical';
        this.rawData = null;
    }

    /**
     * Initialize network visualization
     */
    init(networkData) {
        try {
            debug('Initializing network with data:', networkData);

            this.rawData = networkData;

            // Clear existing data
            this.data.nodes.clear();
            this.data.edges.clear();

            // Add nodes
            if (networkData.nodes && networkData.nodes.length > 0) {
                this.data.nodes.add(networkData.nodes);
            }

            // Add edges
            if (networkData.edges && networkData.edges.length > 0) {
                this.data.edges.add(networkData.edges);
            }

            // Apply layout
            this.applyLayout(this.currentLayout);

            // Create or update network
            if (!this.network) {
                this.network = new vis.Network(this.container, this.data, this.options);
                this.attachEventListeners();
            } else {
                this.network.setData(this.data);
                this.network.setOptions(this.options);
            }

            // Fit network to view
            setTimeout(() => {
                this.network.fit({
                    animation: CONFIG.ANIMATION
                });
            }, 500);

            debug('Network initialized successfully');
            return this.network;

        } catch (error) {
            console.error('Error initializing network:', error);
            throw error;
        }
    }

    /**
     * Apply layout configuration
     */
    applyLayout(layoutType) {
        this.currentLayout = layoutType;
        const layoutOptions = CONFIG.NETWORK_OPTIONS[layoutType];

        if (layoutOptions) {
            this.options = {
                ...this.options,
                ...layoutOptions
            };

            if (this.network) {
                this.network.setOptions(this.options);
            }
        }
    }

    /**
     * Apply filters to network
     */
    applyFilters() {
        if (!this.rawData) return;

        // Filter nodes by difficulty
        const filteredNodes = this.rawData.nodes.filter(node => {
            return this.filters.difficulties.includes(node.group);
        });

        // Filter edges
        let filteredEdges = this.rawData.edges.filter(edge => {
            const sourceNode = filteredNodes.find(n => n.id === edge.from);
            const targetNode = filteredNodes.find(n => n.id === edge.to);
            return sourceNode && targetNode;
        });

        // Filter learning paths if disabled
        if (!this.filters.showLearningPaths) {
            filteredEdges = filteredEdges.filter(edge => !edge.dashes);
        }

        // Update data
        this.data.nodes.clear();
        this.data.edges.clear();
        this.data.nodes.add(filteredNodes);
        this.data.edges.add(filteredEdges);

        // Refit
        if (this.network) {
            this.network.fit({ animation: CONFIG.ANIMATION });
        }
    }

    /**
     * Set difficulty filters
     */
    setDifficultyFilters(difficulties) {
        this.filters.difficulties = difficulties;
        this.applyFilters();
    }

    /**
     * Toggle learning paths
     */
    toggleLearningPaths(show) {
        this.filters.showLearningPaths = show;
        this.applyFilters();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.network) return;

        // Node selection
        this.network.on('selectNode', (params) => {
            debug('Node selected:', params);
            const nodeId = params.nodes[0];
            this.onNodeSelect(nodeId);
        });

        // Edge selection
        this.network.on('selectEdge', (params) => {
            debug('Edge selected:', params);
            const edgeId = params.edges[0];
            this.onEdgeSelect(edgeId);
        });

        // Double click
        this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.onNodeDoubleClick(nodeId);
            }
        });

        // Stabilization progress
        this.network.on('stabilizationProgress', (params) => {
            const progress = Math.round((params.iterations / params.total) * 100);
            debug(`Stabilization progress: ${progress}%`);
        });

        // Stabilization complete
        this.network.on('stabilizationIterationsDone', () => {
            debug('Network stabilized');
            this.network.setOptions({ physics: false });
        });
    }

    /**
     * Handle node selection
     */
    onNodeSelect(nodeId) {
        const node = this.data.nodes.get(nodeId);
        if (node) {
            window.dispatchEvent(new CustomEvent('nodeSelected', { detail: { node } }));
        }
    }

    /**
     * Handle edge selection
     */
    onEdgeSelect(edgeId) {
        const edge = this.data.edges.get(edgeId);
        if (edge) {
            window.dispatchEvent(new CustomEvent('edgeSelected', { detail: { edge } }));
        }
    }

    /**
     * Handle node double click
     */
    onNodeDoubleClick(nodeId) {
        const node = this.data.nodes.get(nodeId);
        if (node) {
            // Focus on this node
            this.network.focus(nodeId, {
                scale: 1.5,
                animation: CONFIG.ANIMATION
            });
        }
    }

    /**
     * Fit network to view
     */
    fit() {
        if (this.network) {
            this.network.fit({ animation: CONFIG.ANIMATION });
        }
    }

    /**
     * Export network as image
     */
    exportAsImage() {
        if (this.network) {
            const canvas = this.container.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'network-map.png';
                link.href = canvas.toDataURL();
                link.click();
            }
        }
    }

    /**
     * Get network statistics
     */
    getStatistics() {
        return {
            nodeCount: this.data.nodes.length,
            edgeCount: this.data.edges.length,
            density: this.calculateDensity(),
            avgDegree: this.calculateAverageDegree()
        };
    }

    /**
     * Calculate network density
     */
    calculateDensity() {
        const n = this.data.nodes.length;
        const e = this.data.edges.length;
        if (n <= 1) return 0;
        return (2 * e) / (n * (n - 1));
    }

    /**
     * Calculate average degree
     */
    calculateAverageDegree() {
        const n = this.data.nodes.length;
        const e = this.data.edges.length;
        if (n === 0) return 0;
        return (2 * e) / n;
    }

    /**
     * Destroy network
     */
    destroy() {
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }
    }
}
