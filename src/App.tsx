import { useState } from 'react'
import MathInputSection from './components/MathInputSection'
import AnalysisDisplay from './components/AnalysisDisplay'
import { AnalysisResult } from './types'

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async (mathInput: string) => {
    setIsAnalyzing(true)

    // TODO: Replace with actual AI analysis
    // For now, using mock data
    const mockAnalysis: AnalysisResult = await analyzeMathProblem(mathInput)

    setAnalysisResult(mockAnalysis)
    setIsAnalyzing(false)
  }

  const handleReset = () => {
    setAnalysisResult(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            수학 학습 시각화 앱
          </h1>
          <p className="text-gray-600 text-lg">
            헷갈리는 부분을 AI가 찾아서 시각적으로 쉽게 설명해드립니다
          </p>
        </header>

        {!analysisResult ? (
          <MathInputSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        ) : (
          <AnalysisDisplay result={analysisResult} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}

// Mock AI analysis function
async function analyzeMathProblem(input: string): Promise<AnalysisResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Simple pattern matching for demo purposes
  const confusingParts: Array<{ id: string; text: string; reason: string; explanation: string; examples: string[] }> = []

  // Detect common confusing patterns
  if (input.includes('분수') || input.includes('/')) {
    confusingParts.push({
      id: '1',
      text: '분수의 나눗셈',
      reason: '분수를 나눌 때 왜 역수를 곱하는지 헷갈릴 수 있습니다',
      explanation: '분수의 나눗셈은 "나누는 수"의 역수를 곱하는 것과 같습니다. 예를 들어, 1/2 ÷ 1/4 는 "1/2를 1/4 크기의 조각으로 나누면 몇 개가 되는가?"를 의미합니다. 이는 1/2 × 4/1 = 2와 같습니다.',
      examples: [
        '3/4 ÷ 1/2 = 3/4 × 2/1 = 6/4 = 3/2',
        '2/3 ÷ 2/5 = 2/3 × 5/2 = 10/6 = 5/3'
      ]
    })
  }

  if (input.includes('미분') || input.includes('도함수') || input.includes("'")) {
    confusingParts.push({
      id: '2',
      text: '미분의 개념',
      reason: '순간변화율과 접선의 기울기 개념이 추상적일 수 있습니다',
      explanation: '미분은 "어떤 순간의 변화 속도"를 나타냅니다. 예를 들어, 자동차의 속도는 위치의 미분입니다. f(x) = x²을 미분하면 f\'(x) = 2x가 되는데, 이는 x=3일 때 접선의 기울기가 6이라는 의미입니다.',
      examples: [
        'f(x) = x² → f\'(x) = 2x',
        'f(x) = 3x³ → f\'(x) = 9x²',
        'f(x) = sin(x) → f\'(x) = cos(x)'
      ]
    })
  }

  if (input.includes('적분') || input.includes('∫')) {
    confusingParts.push({
      id: '3',
      text: '적분의 의미',
      reason: '적분이 왜 "넓이"와 관련있는지, 그리고 미분의 역연산인지 이해하기 어려울 수 있습니다',
      explanation: '적분은 두 가지 의미가 있습니다: (1) 곡선 아래 넓이를 구하는 것 (2) 미분의 역연산. 예를 들어, 속도를 적분하면 이동거리가 됩니다. ∫2x dx = x² + C 는 "기울기가 2x인 함수를 찾는 것"입니다.',
      examples: [
        '∫x dx = (1/2)x² + C',
        '∫3x² dx = x³ + C',
        '∫cos(x) dx = sin(x) + C'
      ]
    })
  }

  if (input.includes('이차방정식') || input.includes('x²')) {
    confusingParts.push({
      id: '4',
      text: '근의 공식',
      reason: '근의 공식의 유도 과정과 판별식의 의미가 복잡할 수 있습니다',
      explanation: 'ax² + bx + c = 0의 해는 x = (-b ± √(b²-4ac)) / 2a 입니다. 판별식 b²-4ac가 양수면 서로 다른 두 실근, 0이면 중근, 음수면 허근을 가집니다.',
      examples: [
        'x² - 5x + 6 = 0 → x = (5 ± √(25-24))/2 = (5 ± 1)/2 → x = 3 또는 2',
        'x² + 2x + 1 = 0 → x = (-2 ± √(4-4))/2 = -1 (중근)'
      ]
    })
  }

  // If no specific patterns found, add a general confusing part
  if (confusingParts.length === 0) {
    confusingParts.push({
      id: '0',
      text: '문제 해결 과정',
      reason: 'AI가 이 문제에서 주의 깊게 봐야 할 부분을 찾았습니다',
      explanation: '수학 문제를 풀 때는 단계별로 차근차근 접근하는 것이 중요합니다. 각 단계에서 사용하는 공식과 원리를 명확히 이해하고 넘어가세요.',
      examples: [
        '문제를 천천히 읽고 주어진 조건 파악하기',
        '알고 있는 공식이나 정리 떠올리기',
        '단계별로 풀이 과정 작성하기'
      ]
    })
  }

  return {
    originalInput: input,
    confusingParts,
    overallSummary: `총 ${confusingParts.length}개의 주의가 필요한 개념을 발견했습니다. 각 개념을 클릭하여 시각적 설명을 확인하세요.`
  }
}

export default App
