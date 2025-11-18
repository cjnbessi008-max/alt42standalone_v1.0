/**
 * Tree Visualizer
 * D3.js를 사용한 부등식 트리 시각화
 */

class TreeVisualizer {
    constructor(containerId, svgId) {
        this.container = document.getElementById(containerId);
        this.svg = d3.select(`#${svgId}`);
        this.treeData = null;
        this.root = null;
        this.nodeClickCallback = null;

        // 레이아웃 설정
        this.width = 360;
        this.height = 280;
        this.nodeRadius = 8;
        this.verticalSpacing = 80;
        this.horizontalSpacing = 100;

        // SVG 크기 설정
        this.svg.attr('width', this.width).attr('height', this.height);

        // 그룹 생성
        this.g = this.svg.append('g').attr('transform', `translate(${this.width / 2}, 30)`);

        // D3 트리 레이아웃 생성
        this.treeLayout = d3.tree().size([this.width - 100, this.height - 60]);

        // 줌 설정
        this.setupZoom();
    }

    /**
     * 줌 기능 설정
     */
    setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(zoom);
    }

    /**
     * 트리 렌더링
     * @param {object} data - 트리 데이터
     */
    render(data) {
        if (!data) {
            console.error('No tree data provided');
            return;
        }

        this.treeData = data;

        // D3 계층 구조 생성
        this.root = d3.hierarchy(data);

        // 트리 레이아웃 적용
        this.treeLayout(this.root);

        // 기존 요소 제거
        this.g.selectAll('*').remove();

        // 링크(선) 그리기
        this.renderLinks();

        // 노드 그리기
        this.renderNodes();

        // 애니메이션
        this.animateEntrance();
    }

    /**
     * 링크(간선) 렌더링
     */
    renderLinks() {
        const links = this.root.links();

        this.g.selectAll('.tree-link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'tree-link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            )
            .style('opacity', 0);
    }

    /**
     * 노드 렌더링
     */
    renderNodes() {
        const nodes = this.root.descendants();

        // 노드 그룹 생성
        const nodeGroup = this.g.selectAll('.tree-node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', d => {
                let className = 'tree-node';
                if (d.data.isFinal) className += ' node-correct';
                return className;
            })
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .style('opacity', 0)
            .on('click', (event, d) => this.onNodeClick(event, d));

        // 원 그리기
        nodeGroup.append('circle')
            .attr('r', this.nodeRadius)
            .attr('fill', d => d.data.isFinal ? '#50c878' : '#4a90e2')
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 2);

        // 단계 번호 표시
        nodeGroup.append('text')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text(d => d.data.stepNumber + 1);

        // 수식 표시 (노드 아래)
        nodeGroup.append('text')
            .attr('dy', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('fill', '#2c3e50')
            .attr('font-weight', '600')
            .text(d => d.data.expression);

        // 연산 표시 (노드 위)
        nodeGroup.append('text')
            .attr('dy', -15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#666')
            .attr('font-style', 'italic')
            .text(d => d.data.operation || '');
    }

    /**
     * 입장 애니메이션
     */
    animateEntrance() {
        // 링크 애니메이션
        this.g.selectAll('.tree-link')
            .transition()
            .duration(600)
            .delay((d, i) => i * 100)
            .style('opacity', 1);

        // 노드 애니메이션
        this.g.selectAll('.tree-node')
            .transition()
            .duration(600)
            .delay((d, i) => i * 100)
            .style('opacity', 1);
    }

    /**
     * 노드 클릭 이벤트
     */
    onNodeClick(event, node) {
        // 노드 하이라이트
        this.highlightNode(node);

        // 툴팁 표시
        this.showTooltip(event, node);

        // 콜백 실행
        if (this.nodeClickCallback) {
            this.nodeClickCallback(node.data);
        }
    }

    /**
     * 노드 하이라이트
     */
    highlightNode(node) {
        // 모든 노드 하이라이트 제거
        this.g.selectAll('.tree-node circle')
            .transition()
            .duration(200)
            .attr('r', this.nodeRadius)
            .attr('stroke-width', 2);

        // 선택된 노드 하이라이트
        this.g.selectAll('.tree-node')
            .filter(d => d === node)
            .select('circle')
            .transition()
            .duration(200)
            .attr('r', this.nodeRadius * 1.3)
            .attr('stroke-width', 3);
    }

    /**
     * 툴팁 표시
     */
    showTooltip(event, node) {
        // 기존 툴팁 제거
        d3.select('.tree-tooltip').remove();

        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tree-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('max-width', '250px')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .html(`
                <div style="margin-bottom: 8px;">
                    <strong style="color: #50c878;">단계 ${node.data.stepNumber + 1}</strong>
                </div>
                <div style="margin-bottom: 6px; font-size: 14px; font-weight: 600;">
                    ${node.data.expression}
                </div>
                <div style="color: #aaa; font-size: 11px; margin-bottom: 4px;">
                    ${node.data.operation}
                </div>
                <div style="font-size: 12px; line-height: 1.4;">
                    ${node.data.explanation}
                </div>
            `);

        // 툴팁 위치 조정
        const x = event.pageX + 10;
        const y = event.pageY - 10;

        tooltip
            .style('left', x + 'px')
            .style('top', y + 'px')
            .style('opacity', 0)
            .transition()
            .duration(200)
            .style('opacity', 1);

        // 3초 후 자동 제거
        setTimeout(() => {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0)
                .remove();
        }, 3000);
    }

    /**
     * 트리 업데이트 (노드 확장/축소 등)
     */
    update(data) {
        this.render(data);
    }

    /**
     * 노드 클릭 콜백 설정
     */
    onNodeClick(callback) {
        this.nodeClickCallback = callback;
    }

    /**
     * 트리 초기화
     */
    clear() {
        this.g.selectAll('*')
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();

        this.treeData = null;
        this.root = null;
    }

    /**
     * 트리 중앙 정렬
     */
    centerTree() {
        const bounds = this.g.node().getBBox();
        const fullWidth = this.width;
        const fullHeight = this.height;
        const width = bounds.width;
        const height = bounds.height;

        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;

        const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight);
        const translate = [
            fullWidth / 2 - scale * midX,
            fullHeight / 2 - scale * midY
        ];

        this.svg.transition()
            .duration(750)
            .call(
                d3.zoom().transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
    }

    /**
     * 모든 노드 확장
     */
    expandAll() {
        if (this.treeData) {
            treeBuilder.expandAll(this.treeData);
            this.render(this.treeData);
        }
    }

    /**
     * 모든 노드 축소
     */
    collapseAll() {
        if (this.treeData) {
            treeBuilder.collapseAll(this.treeData);
            this.render(this.treeData);
        }
    }

    /**
     * 특정 경로 하이라이트
     */
    highlightPath(targetNode) {
        if (!this.root) return;

        const path = treeBuilder.getPath(this.treeData, targetNode);
        const pathIds = path.map(node => node.id);

        // 모든 노드 흐리게
        this.g.selectAll('.tree-node')
            .style('opacity', 0.3);

        this.g.selectAll('.tree-link')
            .style('opacity', 0.2);

        // 경로상의 노드 강조
        this.g.selectAll('.tree-node')
            .filter(d => pathIds.includes(d.data.id))
            .style('opacity', 1);
    }

    /**
     * 하이라이트 초기화
     */
    resetHighlight() {
        this.g.selectAll('.tree-node, .tree-link')
            .transition()
            .duration(300)
            .style('opacity', 1);
    }
}

// 전역 인스턴스는 app.js에서 초기화
