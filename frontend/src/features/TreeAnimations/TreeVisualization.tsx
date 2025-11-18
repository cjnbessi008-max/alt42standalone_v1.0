import React from 'react'
import { motion } from 'framer-motion'
import { Branch } from '../../utils/types'
import './TreeVisualization.css'

interface TreeVisualizationProps {
  branch: Branch
  revealedBranchIds: Set<string>
  onBranchClick?: (branchId: string) => void
}

const BranchComponent: React.FC<TreeVisualizationProps> = ({
  branch,
  revealedBranchIds,
  onBranchClick,
}) => {
  const isRevealed = revealedBranchIds.has(branch.id)

  // 가지 두께 (깊이에 따라 감소)
  const strokeWidth = Math.max(2, 12 - branch.depth * 2)

  // 색상 (깊이에 따라 변화)
  const getColor = (depth: number) => {
    const brown = [139, 69, 19] // 갈색
    const green = [34, 139, 34] // 녹색
    const ratio = Math.min(depth / 5, 1)

    const r = Math.round(brown[0] + (green[0] - brown[0]) * ratio)
    const g = Math.round(brown[1] + (green[1] - brown[1]) * ratio)
    const b = Math.round(brown[2] + (green[2] - brown[2]) * ratio)

    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <>
      {/* 현재 가지 */}
      {isRevealed && (
        <motion.line
          x1={branch.startX}
          y1={branch.startY}
          x2={branch.endX}
          y2={branch.endY}
          stroke={getColor(branch.depth)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="branch-line"
          onClick={() => onBranchClick?.(branch.id)}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      )}

      {/* 끝에 잎 추가 (말단 가지만) */}
      {isRevealed && branch.children.length === 0 && (
        <motion.circle
          cx={branch.endX}
          cy={branch.endY}
          r={4}
          fill="#4CAF50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.3,
            ease: 'backOut',
          }}
        />
      )}

      {/* 자식 가지들 재귀적으로 렌더링 */}
      {branch.children.map((child) => (
        <BranchComponent
          key={child.id}
          branch={child}
          revealedBranchIds={revealedBranchIds}
          onBranchClick={onBranchClick}
        />
      ))}
    </>
  )
}

interface TreeVisualizationMainProps {
  tree: {
    root: Branch
    totalBranches: number
  }
  revealedBranchIds: Set<string>
  onBranchClick?: (branchId: string) => void
}

const TreeVisualization: React.FC<TreeVisualizationMainProps> = ({
  tree,
  revealedBranchIds,
  onBranchClick,
}) => {
  return (
    <div className="tree-visualization-container">
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="tree-svg"
      >
        {/* 배경 그라데이션 */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#E0F6FF" />
          </linearGradient>
        </defs>

        {/* 하늘 배경 */}
        <rect width="400" height="400" fill="url(#skyGradient)" />

        {/* 땅 */}
        <rect y="350" width="400" height="50" fill="#8B7355" />

        {/* 나무 렌더링 */}
        <BranchComponent
          branch={tree.root}
          revealedBranchIds={revealedBranchIds}
          onBranchClick={onBranchClick}
        />
      </svg>
    </div>
  )
}

export default TreeVisualization
