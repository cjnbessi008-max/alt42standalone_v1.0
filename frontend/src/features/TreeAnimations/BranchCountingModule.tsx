import React, { useEffect, useState } from 'react'
import { useBranchStore } from './store/useBranchStore'
import TreeVisualization from './TreeVisualization'
import { flattenBranches } from '../../utils/treeGenerator'
import './BranchCountingModule.css'

const BranchCountingModule: React.FC = () => {
  const {
    tree,
    revealedBranchIds,
    isAnimating,
    feedback,
    difficulty,
    initializeTree,
    revealBranch,
    setAnimating,
    submitAnswer,
    resetModule,
    setDifficulty,
  } = useBranchStore()

  const [inputValue, setInputValue] = useState('')

  // 컴포넌트 마운트 시 트리 초기화
  useEffect(() => {
    initializeTree(difficulty)
  }, [])

  // 애니메이션 시작
  const startAnimation = async () => {
    if (!tree || isAnimating) return

    setAnimating(true)

    // 모든 가지를 평면 배열로 변환
    const allBranches = flattenBranches(tree.root)

    // 깊이 우선 순서로 하나씩 드러내기
    for (const branch of allBranches) {
      revealBranch(branch.id)
      // 속도 조절 (난이도에 따라 조정)
      await new Promise((resolve) => setTimeout(resolve, 300 - difficulty * 30))
    }

    setAnimating(false)
  }

  // 답변 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const answer = parseInt(inputValue)

    if (isNaN(answer) || answer < 0) {
      alert('올바른 숫자를 입력해주세요!')
      return
    }

    submitAnswer(answer)
  }

  // 난이도 변경 핸들러
  const handleDifficultyChange = (newDifficulty: 1 | 2 | 3 | 4 | 5) => {
    setDifficulty(newDifficulty)
    setInputValue('')
  }

  // 다시 시작
  const handleReset = () => {
    resetModule()
    setInputValue('')
  }

  if (!tree) {
    return <div className="loading">트리 생성 중...</div>
  }

  return (
    <div className="branch-counting-module">
      {/* 난이도 선택 */}
      <div className="difficulty-selector">
        <label>난이도:</label>
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
            onClick={() => handleDifficultyChange(level as 1 | 2 | 3 | 4 | 5)}
            disabled={isAnimating}
          >
            {level}
          </button>
        ))}
      </div>

      {/* 트리 시각화 */}
      <TreeVisualization
        tree={tree}
        revealedBranchIds={revealedBranchIds}
      />

      {/* 컨트롤 패널 */}
      <div className="control-panel">
        <button
          className="animate-btn"
          onClick={startAnimation}
          disabled={isAnimating || revealedBranchIds.size > 0}
        >
          {isAnimating ? '애니메이션 진행 중...' : '가지 보여주기'}
        </button>

        <button
          className="reset-btn"
          onClick={handleReset}
          disabled={isAnimating}
        >
          다시 시작
        </button>
      </div>

      {/* 답변 입력 폼 */}
      {revealedBranchIds.size > 0 && !isAnimating && (
        <form className="answer-form" onSubmit={handleSubmit}>
          <label htmlFor="branch-count">가지가 총 몇 개인가요?</label>
          <input
            id="branch-count"
            type="number"
            min="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="숫자를 입력하세요"
            autoFocus
          />
          <button type="submit">제출</button>
        </form>
      )}

      {/* 피드백 메시지 */}
      {feedback && (
        <div className={`feedback feedback-${feedback.type}`}>
          <p>{feedback.message}</p>
          {feedback.type === 'success' && (
            <button onClick={handleReset} className="next-btn">
              다음 문제
            </button>
          )}
        </div>
      )}

      {/* 진행 상황 표시 */}
      <div className="progress-info">
        <p>드러난 가지: {revealedBranchIds.size} / {tree.totalBranches}</p>
      </div>
    </div>
  )
}

export default BranchCountingModule
