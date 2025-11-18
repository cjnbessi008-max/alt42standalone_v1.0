import { Box, Typography, Paper, Chip } from '@mui/material'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useProblemStore } from '../store/problemStore'

const ruleColors: Record<string, string> = {
  power_rule: '#FF6B6B',
  chain_rule: '#4ECDC4',
  product_rule: '#95E1D3',
  quotient_rule: '#F8B739',
  constant_rule: '#A29BFE',
  sum_rule: '#74B9FF',
}

const ruleNames: Record<string, string> = {
  power_rule: 'Power Rule',
  chain_rule: 'Chain Rule',
  product_rule: 'Product Rule',
  quotient_rule: 'Quotient Rule',
  constant_rule: 'Constant Rule',
  sum_rule: 'Sum Rule',
}

export default function VirtualSmartphone() {
  const problemData = useProblemStore(state => state.problemData)

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}
    >
      {/* Smartphone Frame */}
      <Box
        sx={{
          width: 380,
          height: 750,
          background: '#1a1a1a',
          borderRadius: '40px',
          padding: '15px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 2px #2c2c2c, 0 0 0 12px #1a1a1a',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <Box
          sx={{
            position: 'absolute',
            top: 15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 150,
            height: 25,
            background: '#1a1a1a',
            borderRadius: '0 0 20px 20px',
            zIndex: 2,
          }}
        />

        {/* Screen */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'white',
            borderRadius: '30px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* App Header */}
          <Box
            sx={{
              background: '#2196F3',
              color: 'white',
              padding: '40px 20px 15px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" fontWeight="600">
              Derivative Focus
            </Typography>
          </Box>

          {/* Problem Display */}
          <Box
            sx={{
              flex: 1,
              p: 2.5,
              overflowY: 'auto',
              background: '#FAFAFA',
            }}
          >
            {!problemData ? (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 5 }}>
                <Typography variant="h4" gutterBottom>
                  👋
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  환영합니다!
                  <br />
                  미분 문제를 불러오면
                  <br />
                  AI가 핵심 규칙 3가지를
                  <br />
                  자동으로 강조합니다.
                </Typography>
              </Box>
            ) : (
              <>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight="600"
                    sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}
                  >
                    미분 문제
                  </Typography>

                  {problemData.problem_latex ? (
                    <Box sx={{ fontSize: '1.1rem' }}>
                      <BlockMath math={problemData.problem_latex} />
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {problemData.problem_text}
                    </Typography>
                  )}
                </Paper>

                {problemData.ai_analysis && (
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      mb: 2,
                      background: '#E3F2FD',
                    }}
                  >
                    <Typography variant="caption" fontWeight="600" color="primary" gutterBottom>
                      AI 분석
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {problemData.ai_analysis}
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </Box>

          {/* Rules Panel */}
          <Box
            sx={{
              background: 'white',
              borderTop: '1px solid #E0E0E0',
              p: 2,
              maxHeight: 250,
              overflowY: 'auto',
            }}
          >
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              검출된 핵심 규칙
            </Typography>

            {!problemData || problemData.detected_rules.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 2.5, fontSize: '0.85rem' }}
              >
                규칙이 검출되지 않았습니다
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {problemData.detected_rules.map((rule, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      background: '#FAFAFA',
                      borderLeft: `4px solid ${ruleColors[rule.rule_type] || '#2196F3'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                        {rule.rule_name}
                      </Typography>
                      {rule.confidence_score && (
                        <Chip
                          label={`${Math.round(rule.confidence_score * 100)}%`}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {rule.rule_formula}
                    </Typography>

                    {rule.matched_expression && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          display: 'block',
                          fontStyle: 'italic',
                        }}
                      >
                        적용: {rule.matched_expression}
                      </Typography>
                    )}

                    {rule.ai_explanation && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          display: 'block',
                          mt: 0.5,
                          lineHeight: 1.4,
                        }}
                      >
                        💡 {rule.ai_explanation}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Home Button */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 140,
            height: 4,
            background: '#4a4a4a',
            borderRadius: '2px',
          }}
        />
      </Box>
    </Box>
  )
}
