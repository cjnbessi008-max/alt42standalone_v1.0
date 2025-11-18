import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { getGraphData } from '../services/api'

export default function VisualizationPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ category: '', difficulty_level: '' })

  useEffect(() => {
    loadVisualization()
  }, [filter])

  const loadVisualization = async () => {
    try {
      const response = await getGraphData(filter)
      const data = response.data.data

      if (svgRef.current) {
        renderGraph(data)
      }
    } catch (error) {
      console.error('Failed to load graph:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderGraph = (data: any) => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 1200
    const height = 800

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g')

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom as any)

    // Prepare nodes and links
    const nodes = [
      ...data.nodes.concepts.map((c: any) => ({
        id: `concept-${c.id}`,
        type: 'concept',
        data: c,
        label: c.name
      })),
      ...data.nodes.problems.map((p: any) => ({
        id: `problem-${p.id}`,
        type: 'problem',
        data: p,
        label: p.title
      }))
    ]

    const links = data.edges.mappings.map((m: any) => ({
      source: `concept-${m.concept_id}`,
      target: `problem-${m.problem_id}`,
      relevance: m.relevance_score
    }))

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => d.relevance * 3)

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)

    node.append('circle')
      .attr('r', (d: any) => d.type === 'concept' ? 25 : 20)
      .attr('fill', (d: any) => d.type === 'concept' ? '#4CAF50' : '#2196F3')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    node.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .text((d: any) => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label)

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: any) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">개념-문제 관계 시각화</h1>
        <div className="flex gap-4 items-center">
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-4 py-2 border rounded"
          >
            <option value="">모든 카테고리</option>
            <option value="수학-분수">수학-분수</option>
            <option value="수학-소수">수학-소수</option>
          </select>

          <select
            value={filter.difficulty_level}
            onChange={(e) => setFilter({ ...filter, difficulty_level: e.target.value })}
            className="px-4 py-2 border rounded"
          >
            <option value="">모든 난이도</option>
            <option value="beginner">초급</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-concept"></div>
              <span className="text-sm">개념</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-problem"></div>
              <span className="text-sm">문제</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <svg ref={svgRef} className="w-full" style={{ height: '800px' }}></svg>
      </div>
    </div>
  )
}
