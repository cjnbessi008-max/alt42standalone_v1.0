/**
 * D3.js 기반 개념-문제 관계 시각화 모듈
 */

class GraphVisualization {
    constructor(containerId) {
        this.container = d3.select(`#${containerId}`);
        this.width = this.container.node().clientWidth;
        this.height = this.container.node().clientHeight;

        this.svg = this.container
            .attr('width', this.width)
            .attr('height', this.height);

        this.g = this.svg.append('g');

        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.selectedNode = null;

        this.setupZoom();
        this.setupControls();
    }

    /**
     * 줌 기능 설정
     */
    setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(zoom);
        this.zoom = zoom;
    }

    /**
     * 컨트롤 버튼 설정
     */
    setupControls() {
        d3.select('#zoomInBtn').on('click', () => {
            this.svg.transition().call(this.zoom.scaleBy, 1.3);
        });

        d3.select('#zoomOutBtn').on('click', () => {
            this.svg.transition().call(this.zoom.scaleBy, 0.7);
        });

        d3.select('#fitBtn').on('click', () => {
            this.fitToView();
        });
    }

    /**
     * 그래프 데이터 로드 및 렌더링
     */
    async loadAndRender(filters = {}) {
        try {
            const response = await API.graph.getData(filters);
            const data = response.data;

            this.renderGraph(data);
            this.updateStatistics(data.statistics);
            showToast('그래프를 성공적으로 불러왔습니다.', 'success');

        } catch (error) {
            console.error('Graph loading error:', error);
            showToast('그래프 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 그래프 렌더링
     */
    renderGraph(data) {
        // 노드 데이터 준비
        this.nodes = [
            ...data.nodes.concepts.map(c => ({
                id: `concept-${c.id}`,
                type: 'concept',
                data: c,
                label: c.name,
                difficulty: c.difficulty_level
            })),
            ...data.nodes.problems.map(p => ({
                id: `problem-${p.id}`,
                type: 'problem',
                data: p,
                label: p.title,
                difficulty: p.difficulty_level
            }))
        ];

        // 링크 데이터 준비
        this.links = data.edges.map(e => ({
            source: `concept-${e.concept_id}`,
            target: `problem-${e.problem_id}`,
            relevance: e.relevance_score,
            isPrimary: e.is_primary,
            type: e.mapping_type
        }));

        // 기존 그래프 제거
        this.g.selectAll('*').remove();

        // 시뮬레이션 설정
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(40));

        // 링크 그리기
        const link = this.g.append('g')
            .selectAll('line')
            .data(this.links)
            .enter()
            .append('line')
            .attr('class', d => `link ${d.isPrimary ? 'primary' : 'related'}`)
            .attr('stroke-width', d => d.relevance * 3);

        // 노드 그리기
        const node = this.g.append('g')
            .selectAll('g')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(this.drag());

        // 노드 원
        node.append('circle')
            .attr('r', d => d.type === 'concept' ? 25 : 20)
            .attr('fill', d => d.type === 'concept' ? '#4CAF50' : '#2196F3')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // 노드 레이블
        node.append('text')
            .attr('class', 'node-label')
            .attr('dy', 35)
            .text(d => this.truncateText(d.label, 15))
            .attr('fill', '#333')
            .style('font-size', '11px');

        // 노드 클릭 이벤트
        node.on('click', (event, d) => {
            this.selectNode(d, node);
        });

        // 시뮬레이션 업데이트
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // 초기 화면 맞춤
        setTimeout(() => this.fitToView(), 500);
    }

    /**
     * 드래그 기능
     */
    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    /**
     * 노드 선택
     */
    async selectNode(nodeData, allNodes) {
        this.selectedNode = nodeData;

        // 시각적 선택 표시
        allNodes.selectAll('circle').classed('selected', false);
        allNodes.filter(d => d.id === nodeData.id)
            .selectAll('circle')
            .classed('selected', true);

        // 상세 정보 표시
        await this.showNodeDetails(nodeData);
    }

    /**
     * 노드 상세 정보 표시
     */
    async showNodeDetails(nodeData) {
        const detailsDiv = document.getElementById('nodeDetails');

        if (nodeData.type === 'concept') {
            const concept = nodeData.data;
            let html = `
                <div class="detail-item">
                    <span class="detail-label">개념 이름:</span>
                    <span class="detail-value">${concept.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">카테고리:</span>
                    <span class="detail-value">${concept.category || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">난이도:</span>
                    <span class="detail-value">${this.getDifficultyLabel(concept.difficulty_level)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">설명:</span>
                    <span class="detail-value">${concept.description || '설명 없음'}</span>
                </div>
            `;

            // 연결된 문제 가져오기
            try {
                const problemsResponse = await API.concepts.getProblems(concept.id);
                const problems = problemsResponse.data;

                if (problems && problems.length > 0) {
                    html += `
                        <div class="detail-item">
                            <span class="detail-label">연결된 문제 (${problems.length}개):</span>
                            <ul class="problem-list">
                    `;

                    problems.slice(0, 5).forEach(p => {
                        html += `
                            <li>
                                ${p.title}
                                <span class="difficulty-badge difficulty-${p.difficulty_level}">
                                    ${this.getDifficultyLabel(p.difficulty_level)}
                                </span>
                            </li>
                        `;
                    });

                    html += `</ul></div>`;
                }
            } catch (error) {
                console.error('Error loading problems:', error);
            }

            detailsDiv.innerHTML = html;

        } else if (nodeData.type === 'problem') {
            const problem = nodeData.data;
            let html = `
                <div class="detail-item">
                    <span class="detail-label">문제 제목:</span>
                    <span class="detail-value">${problem.title}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">유형:</span>
                    <span class="detail-value">${problem.problem_type || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">난이도:</span>
                    <span class="detail-value">${this.getDifficultyLabel(problem.difficulty_level)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">배점:</span>
                    <span class="detail-value">${problem.points}점</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">설명:</span>
                    <span class="detail-value">${problem.description || '설명 없음'}</span>
                </div>
            `;

            detailsDiv.innerHTML = html;
        }
    }

    /**
     * 통계 업데이트
     */
    updateStatistics(stats) {
        document.getElementById('conceptCount').textContent = stats.total_concepts || 0;
        document.getElementById('problemCount').textContent = stats.total_problems || 0;
        document.getElementById('mappingCount').textContent = stats.total_mappings || 0;
    }

    /**
     * 화면 맞춤
     */
    fitToView() {
        if (this.nodes.length === 0) return;

        const bounds = this.g.node().getBBox();
        const fullWidth = this.width;
        const fullHeight = this.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;

        if (width === 0 || height === 0) return;

        const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    /**
     * 초기화
     */
    reset() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * 헬퍼 메서드
     */
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getDifficultyLabel(level) {
        const labels = {
            'beginner': '초급',
            'intermediate': '중급',
            'advanced': '고급',
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        };
        return labels[level] || level;
    }
}
