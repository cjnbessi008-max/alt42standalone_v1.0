import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { fetchSolutionFlowchart } from '../services/api'
import { SolutionFlowchart } from '../types/flowchart'

const FlowchartViewer = () => {
  const { solutionId } = useParams<{ solutionId: string }>()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [solution, setSolution] = useState<SolutionFlowchart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFlowchart = useCallback(async (regenerate = false) => {
    if (!solutionId) return

    setLoading(true)
    setError(null)

    try {
      const data = await fetchSolutionFlowchart(solutionId, regenerate)
      setSolution(data)

      // Convert backend nodes to React Flow nodes
      const flowNodes: Node[] = data.flowchart.nodes.map((node) => ({
        id: node.id,
        type: node.node_type === 'decision' ? 'default' : 'default',
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <strong>{node.label}</strong>
              {node.description && (
                <div style={{ fontSize: '0.8em', marginTop: '4px' }}>
                  {node.description}
                </div>
              )}
            </div>
          ),
        },
        style: {
          backgroundColor: node.style?.backgroundColor || '#ffffff',
          border: `2px solid ${node.style?.borderColor || '#000000'}`,
          color: node.style?.color || '#000000',
          borderRadius: node.node_type === 'decision' ? '50%' : '8px',
          padding: '12px',
          minWidth: '150px',
        },
      }))

      // Convert backend edges to React Flow edges
      const flowEdges: Edge[] = data.flowchart.edges.map((edge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        label: edge.label,
        animated: edge.style?.animated || false,
        style: {
          stroke: edge.style?.strokeColor || '#666666',
          strokeWidth: edge.style?.strokeWidth || 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.style?.strokeColor || '#666666',
        },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (err: any) {
      setError(err.message || 'Failed to load flowchart')
    } finally {
      setLoading(false)
    }
  }, [solutionId, setNodes, setEdges])

  useEffect(() => {
    loadFlowchart()
  }, [loadFlowchart])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              학생 풀이 흐름도
            </Typography>
            {solution && (
              <Stack direction="row" spacing={1}>
                <Chip
                  label={solution.is_correct ? '정답' : '오답'}
                  color={solution.is_correct ? 'success' : 'error'}
                  size="small"
                />
                <Chip
                  label={`시도 횟수: ${solution.attempts_count}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`힌트 사용: ${solution.hints_used_count}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`소요 시간: ${solution.time_spent_seconds}초`}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadFlowchart(true)}
          >
            새로고침
          </Button>
        </Stack>
      </Paper>

      {/* Flowchart */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const bgColor = node.style?.backgroundColor
              return typeof bgColor === 'string' ? bgColor : '#ffffff'
            }}
          />
          <Background gap={12} size={1} />
        </ReactFlow>
      </Box>

      {/* Action Timeline */}
      {solution && solution.actions.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, maxHeight: '200px', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            행동 타임라인
          </Typography>
          <Stack spacing={1}>
            {solution.actions.map((action, index) => (
              <Card key={index} variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      <strong>{action.sequence_number}.</strong> {action.action_type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(action.timestamp).toLocaleTimeString('ko-KR')}
                    </Typography>
                  </Stack>
                  {action.action_data && (
                    <Typography variant="caption" color="text.secondary">
                      {JSON.stringify(action.action_data, null, 2)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

export default FlowchartViewer
