/**
 * Focus Light 웹앱 - 도형 렌더러
 * SVG를 사용하여 도형을 렌더링
 */

const ShapeRenderer = {
    /**
     * 도형 렌더링
     */
    renderShapes(shapes) {
        const canvas = document.getElementById('shape-canvas');
        canvas.innerHTML = '';

        console.log('도형 렌더링 중:', shapes.length, '개');

        shapes.forEach((shape, index) => {
            this.renderShape(canvas, shape, index);
        });
    },

    /**
     * 개별 도형 렌더링
     */
    renderShape(canvas, shape, index) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', `shape-${shape.id}`);
        group.setAttribute('class', 'shape-group');

        // 도형 타입에 따라 렌더링
        switch (shape.shape_type) {
            case 'triangle':
                this.renderTriangle(group, shape);
                break;
            case 'rectangle':
            case 'square':
                this.renderRectangle(group, shape);
                break;
            case 'circle':
                this.renderCircle(group, shape);
                break;
            default:
                this.renderCustomShape(group, shape);
        }

        canvas.appendChild(group);
    },

    /**
     * 삼각형 렌더링
     */
    renderTriangle(group, shape) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', shape.svg_data);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#2C3E50');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'shape-main');

        group.appendChild(path);

        // 속성에서 정보 추출
        if (shape.properties) {
            const props = shape.properties;

            // 각도 표시
            if (props.angles) {
                this.addAngleMarkers(group, shape.svg_data, props.angles);
            }

            // 빗변 강조용 클래스 추가
            if (props.sides && props.sides.c) {
                const hypotenuse = this.createHypotenusePath(shape.svg_data);
                hypotenuse.setAttribute('class', 'hypotenuse focus-target');
                hypotenuse.setAttribute('data-shape-id', shape.id);
                group.appendChild(hypotenuse);
            }
        }
    },

    /**
     * 직사각형/정사각형 렌더링
     */
    renderRectangle(group, shape) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', shape.svg_data);
        path.setAttribute('fill', 'rgba(74, 144, 226, 0.1)');
        path.setAttribute('stroke', '#2C3E50');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'shape-main');

        group.appendChild(path);

        // 한 변 강조
        if (shape.properties) {
            const sidePath = this.createSidePath(shape.svg_data);
            sidePath.setAttribute('class', 'side-length focus-target');
            sidePath.setAttribute('data-shape-id', shape.id);
            group.appendChild(sidePath);
        }
    },

    /**
     * 원 렌더링
     */
    renderCircle(group, shape) {
        const props = shape.properties;

        // 원
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', props.center.x);
        circle.setAttribute('cy', props.center.y);
        circle.setAttribute('r', props.radius);
        circle.setAttribute('fill', 'rgba(155, 89, 182, 0.1)');
        circle.setAttribute('stroke', '#2C3E50');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', 'shape-main');

        group.appendChild(circle);

        // 반지름 선
        const radiusLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        radiusLine.setAttribute('x1', props.center.x);
        radiusLine.setAttribute('y1', props.center.y);
        radiusLine.setAttribute('x2', props.center.x + props.radius);
        radiusLine.setAttribute('y2', props.center.y);
        radiusLine.setAttribute('stroke', '#9B59B6');
        radiusLine.setAttribute('stroke-width', '2');
        radiusLine.setAttribute('class', 'radius-line focus-target');
        radiusLine.setAttribute('data-shape-id', shape.id);

        group.appendChild(radiusLine);

        // 중심점
        const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centerDot.setAttribute('cx', props.center.x);
        centerDot.setAttribute('cy', props.center.y);
        centerDot.setAttribute('r', '4');
        centerDot.setAttribute('fill', '#9B59B6');

        group.appendChild(centerDot);

        // 반지름 라벨
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', props.center.x + props.radius / 2);
        label.setAttribute('y', props.center.y - 10);
        label.setAttribute('class', 'length-label');
        label.setAttribute('fill', '#9B59B6');
        label.textContent = 'r';

        group.appendChild(label);
    },

    /**
     * 커스텀 도형 렌더링
     */
    renderCustomShape(group, shape) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', shape.svg_data);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#2C3E50');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'shape-main');

        group.appendChild(path);
    },

    /**
     * 각도 마커 추가
     */
    addAngleMarkers(group, pathData, angles) {
        // 경로에서 점 추출
        const points = this.extractPointsFromPath(pathData);

        if (points.length >= 3) {
            // 직각 마커 (90도)
            if (angles.includes(90)) {
                const rightAngleMarker = this.createRightAngleMarker(points[1], points[0], points[2]);
                rightAngleMarker.setAttribute('class', 'right-angle focus-target angle-marker');
                group.appendChild(rightAngleMarker);

                // 각도 라벨
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', points[1].x - 15);
                label.setAttribute('y', points[1].y - 10);
                label.setAttribute('class', 'length-label');
                label.setAttribute('fill', '#FF6B6B');
                label.textContent = '90°';
                group.appendChild(label);
            }
        }
    },

    /**
     * 경로에서 점 추출
     */
    extractPointsFromPath(pathData) {
        const points = [];
        const regex = /M\s*([0-9.]+)[,\s]+([0-9.]+)|L\s*([0-9.]+)[,\s]+([0-9.]+)/g;
        let match;

        while ((match = regex.exec(pathData)) !== null) {
            if (match[1] && match[2]) {
                points.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
            } else if (match[3] && match[4]) {
                points.push({ x: parseFloat(match[3]), y: parseFloat(match[4]) });
            }
        }

        return points;
    },

    /**
     * 직각 마커 생성
     */
    createRightAngleMarker(vertex, p1, p2) {
        const size = 15;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // 벡터 계산
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

        // 정규화
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        v1.x = (v1.x / len1) * size;
        v1.y = (v1.y / len1) * size;
        v2.x = (v2.x / len2) * size;
        v2.y = (v2.y / len2) * size;

        // 직각 기호 경로
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${vertex.x + v1.x},${vertex.y + v1.y}
                   L ${vertex.x + v1.x + v2.x},${vertex.y + v1.y + v2.y}
                   L ${vertex.x + v2.x},${vertex.y + v2.y}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#FF6B6B');
        path.setAttribute('stroke-width', '2');

        group.appendChild(path);
        return group;
    },

    /**
     * 빗변 경로 생성
     */
    createHypotenusePath(pathData) {
        const points = this.extractPointsFromPath(pathData);

        if (points.length >= 3) {
            // 첫 번째와 마지막에서 두 번째 점을 연결 (빗변)
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', points[0].x);
            line.setAttribute('y1', points[0].y);
            line.setAttribute('x2', points[2].x);
            line.setAttribute('y2', points[2].y);
            line.setAttribute('stroke', '#FFD700');
            line.setAttribute('stroke-width', '3');

            return line;
        }

        return document.createElementNS('http://www.w3.org/2000/svg', 'line');
    },

    /**
     * 한 변 경로 생성
     */
    createSidePath(pathData) {
        const points = this.extractPointsFromPath(pathData);

        if (points.length >= 2) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', points[0].x);
            line.setAttribute('y1', points[0].y);
            line.setAttribute('x2', points[1].x);
            line.setAttribute('y2', points[1].y);
            line.setAttribute('stroke', '#4ECDC4');
            line.setAttribute('stroke-width', '3');

            return line;
        }

        return document.createElementNS('http://www.w3.org/2000/svg', 'line');
    }
};

// 전역으로 노출
window.ShapeRenderer = ShapeRenderer;
