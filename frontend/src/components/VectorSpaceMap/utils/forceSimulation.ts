import * as d3 from 'd3';
import type { Concept, ConceptRelationship } from '@types/index';

export interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  concept: Concept;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string | SimulationNode;
  target: string | SimulationNode;
  relationship: ConceptRelationship;
}

/**
 * D3 Force Simulation 생성 및 관리
 */
export class ForceSimulation {
  private simulation: d3.Simulation<SimulationNode, SimulationLink>;
  private nodes: SimulationNode[];
  private links: SimulationLink[];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.nodes = [];
    this.links = [];

    // Force Simulation 초기화
    this.simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
      .force('link', d3.forceLink<SimulationNode, SimulationLink>().id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));
  }

  /**
   * 데이터 업데이트
   */
  updateData(concepts: Concept[], relationships: ConceptRelationship[]) {
    // 노드 생성
    this.nodes = concepts.map(concept => ({
      id: concept.id,
      concept,
      x: concept.position?.x || Math.random() * this.width,
      y: concept.position?.y || Math.random() * this.height,
    }));

    // 링크 생성
    this.links = relationships.map(rel => ({
      source: rel.sourceId,
      target: rel.targetId,
      relationship: rel,
    }));

    // Simulation 업데이트
    this.simulation
      .nodes(this.nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(this.links).id(d => d.id));

    return { nodes: this.nodes, links: this.links };
  }

  /**
   * Tick 이벤트 리스너 추가
   */
  onTick(callback: (nodes: SimulationNode[], links: SimulationLink[]) => void) {
    this.simulation.on('tick', () => {
      callback(this.nodes, this.links);
    });
  }

  /**
   * 드래그 동작 핸들러
   */
  getDragBehavior() {
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
      if (!event.active) this.simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGCircleElement, SimulationNode>()
      .on('start', dragstarted.bind(this))
      .on('drag', dragged.bind(this))
      .on('end', dragended.bind(this));
  }

  /**
   * Simulation 시작
   */
  start() {
    this.simulation.alpha(1).restart();
  }

  /**
   * Simulation 정지
   */
  stop() {
    this.simulation.stop();
  }

  /**
   * Simulation 재시작
   */
  restart() {
    this.simulation.alpha(0.3).restart();
  }

  /**
   * 리사이즈
   */
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.simulation.force('center', d3.forceCenter(width / 2, height / 2));
    this.restart();
  }

  /**
   * 정리
   */
  destroy() {
    this.simulation.stop();
    this.simulation.on('tick', null);
  }
}

export default ForceSimulation;
