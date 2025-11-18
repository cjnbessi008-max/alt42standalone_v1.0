/**
 * Tree Builder
 * 부등식 풀이 단계를 트리 구조로 변환
 */

class TreeBuilder {
    constructor() {
        this.nodeIdCounter = 0;
    }

    /**
     * 풀이 단계에서 트리 데이터 생성
     * @param {array} steps - 풀이 단계 배열
     * @returns {object} D3.js 계층 구조 데이터
     */
    buildFromSteps(steps) {
        if (!steps || !Array.isArray(steps) || steps.length === 0) {
            return null;
        }

        this.nodeIdCounter = 0;

        // 루트 노드 생성
        const root = this.createNode(
            steps[0].expression,
            steps[0].operation,
            steps[0].explanation,
            0,
            true
        );

        // 자식 노드들 재귀적으로 생성
        this.buildChildren(root, steps, 1);

        return root;
    }

    /**
     * 자식 노드 재귀 생성
     */
    buildChildren(parentNode, steps, currentIndex) {
        if (currentIndex >= steps.length) {
            return;
        }

        const step = steps[currentIndex];
        const childNode = this.createNode(
            step.expression,
            step.operation,
            step.explanation,
            currentIndex,
            currentIndex === steps.length - 1  // 마지막 단계인지
        );

        if (!parentNode.children) {
            parentNode.children = [];
        }

        parentNode.children.push(childNode);

        // 다음 단계로 재귀
        this.buildChildren(childNode, steps, currentIndex + 1);
    }

    /**
     * 노드 객체 생성
     */
    createNode(expression, operation, explanation, stepNumber, isFinal = false) {
        return {
            id: `node-${this.nodeIdCounter++}`,
            expression: expression,
            operation: operation,
            explanation: explanation,
            stepNumber: stepNumber,
            isFinal: isFinal,
            expanded: true,
            children: []
        };
    }

    /**
     * 트리를 선형 풀이 과정으로 변환
     */
    treeToSteps(root) {
        const steps = [];

        const traverse = (node) => {
            steps.push({
                step: node.stepNumber + 1,
                expression: node.expression,
                operation: node.operation,
                explanation: node.explanation
            });

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => traverse(child));
            }
        };

        traverse(root);
        return steps;
    }

    /**
     * 분기형 트리 생성 (복잡한 부등식용)
     * 예: 이차부등식에서 경우의 수 표현
     */
    buildBranchingTree(baseSteps, branches) {
        const root = this.buildFromSteps(baseSteps);

        if (branches && branches.length > 0) {
            const lastNode = this.getLastNode(root);

            branches.forEach(branch => {
                const branchNode = this.createNode(
                    branch.expression,
                    branch.operation,
                    branch.explanation,
                    lastNode.stepNumber + 1
                );
                lastNode.children.push(branchNode);
            });
        }

        return root;
    }

    /**
     * 마지막 노드 찾기
     */
    getLastNode(root) {
        let current = root;
        while (current.children && current.children.length > 0) {
            current = current.children[0];
        }
        return current;
    }

    /**
     * 노드 확장/축소 토글
     */
    toggleNode(node) {
        node.expanded = !node.expanded;
        return node.expanded;
    }

    /**
     * 모든 노드 확장
     */
    expandAll(root) {
        const expand = (node) => {
            node.expanded = true;
            if (node.children) {
                node.children.forEach(child => expand(child));
            }
        };
        expand(root);
    }

    /**
     * 모든 노드 축소
     */
    collapseAll(root) {
        const collapse = (node) => {
            if (node.children && node.children.length > 0) {
                node.expanded = false;
                node.children.forEach(child => collapse(child));
            }
        };
        collapse(root);
    }

    /**
     * 노드 검색
     */
    findNode(root, predicate) {
        if (predicate(root)) {
            return root;
        }

        if (root.children) {
            for (const child of root.children) {
                const found = this.findNode(child, predicate);
                if (found) return found;
            }
        }

        return null;
    }

    /**
     * 트리 깊이 계산
     */
    getDepth(root) {
        if (!root.children || root.children.length === 0) {
            return 1;
        }

        const childDepths = root.children.map(child => this.getDepth(child));
        return 1 + Math.max(...childDepths);
    }

    /**
     * 노드 개수 계산
     */
    getNodeCount(root) {
        let count = 1;

        if (root.children) {
            root.children.forEach(child => {
                count += this.getNodeCount(child);
            });
        }

        return count;
    }

    /**
     * 경로 찾기 (루트에서 특정 노드까지)
     */
    getPath(root, targetNode) {
        const path = [];

        const findPath = (node) => {
            path.push(node);

            if (node.id === targetNode.id) {
                return true;
            }

            if (node.children) {
                for (const child of node.children) {
                    if (findPath(child)) {
                        return true;
                    }
                }
            }

            path.pop();
            return false;
        };

        findPath(root);
        return path;
    }

    /**
     * 트리 복제
     */
    clone(root) {
        const cloned = {
            ...root,
            children: []
        };

        if (root.children) {
            cloned.children = root.children.map(child => this.clone(child));
        }

        return cloned;
    }

    /**
     * 트리를 JSON으로 직렬화
     */
    toJSON(root) {
        return JSON.stringify(root, null, 2);
    }

    /**
     * JSON에서 트리 복원
     */
    fromJSON(json) {
        try {
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to parse tree JSON:', error);
            return null;
        }
    }
}

// 전역 인스턴스 생성
const treeBuilder = new TreeBuilder();
