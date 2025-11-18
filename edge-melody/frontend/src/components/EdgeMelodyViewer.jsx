import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './EdgeMelodyViewer.css'

/**
 * 3D 큐브의 모서리를 음악처럼 점등시키는 컴포넌트
 */
const EdgeMelody = ({ edges = [], colorScheme = ['#00ff88', '#00ccff', '#ff00ff'] }) => {
  const groupRef = useRef()
  const [time, setTime] = useState(0)

  useFrame((state, delta) => {
    setTime(prev => prev + delta)

    // 큐브 회전
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.2
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  // 12개 모서리 정의 (정육면체)
  const edgeDefinitions = useMemo(() => [
    // 하단 면
    { start: [-1, -1, -1], end: [1, -1, -1] },
    { start: [1, -1, -1], end: [1, -1, 1] },
    { start: [1, -1, 1], end: [-1, -1, 1] },
    { start: [-1, -1, 1], end: [-1, -1, -1] },
    // 상단 면
    { start: [-1, 1, -1], end: [1, 1, -1] },
    { start: [1, 1, -1], end: [1, 1, 1] },
    { start: [1, 1, 1], end: [-1, 1, 1] },
    { start: [-1, 1, 1], end: [-1, 1, -1] },
    // 수직 모서리
    { start: [-1, -1, -1], end: [-1, 1, -1] },
    { start: [1, -1, -1], end: [1, 1, -1] },
    { start: [1, -1, 1], end: [1, 1, 1] },
    { start: [-1, -1, 1], end: [-1, 1, 1] },
  ], [])

  return (
    <group ref={groupRef}>
      {edgeDefinitions.map((edge, index) => {
        const edgeData = edges[index] || { active: true, intensity: 1.0, delay: index * 0.15 }
        const points = [
          new THREE.Vector3(...edge.start),
          new THREE.Vector3(...edge.end)
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)

        // 음악적 점등 효과 계산
        const wave = Math.sin(time * 2 - edgeData.delay * 2) * 0.5 + 0.5
        const intensity = edgeData.active ? edgeData.intensity * wave : 0.1

        // 색상 순환
        const colorIndex = Math.floor(time + index) % colorScheme.length
        const color = colorScheme[colorIndex]

        return (
          <line key={index} geometry={geometry}>
            <lineBasicMaterial
              color={color}
              linewidth={3}
              opacity={intensity}
              transparent={true}
            />
          </line>
        )
      })}

      {/* 꼭짓점 표시 */}
      {[
        [-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1],
        [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]
      ].map((pos, i) => (
        <mesh key={`vertex-${i}`} position={pos}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={colorScheme[i % colorScheme.length]}
            emissive={colorScheme[i % colorScheme.length]}
            emissiveIntensity={Math.sin(time * 3 + i) * 0.5 + 0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Edge Melody 뷰어 메인 컴포넌트
 */
const EdgeMelodyViewer = ({ questionData, visualizationData }) => {
  if (!questionData) {
    return (
      <div className="edge-melody-viewer empty">
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>문제를 선택해주세요</p>
        </div>
      </div>
    )
  }

  const edges = visualizationData?.edges || []
  const colorScheme = visualizationData?.animation?.color_scheme || ['#00ff88', '#00ccff', '#ff00ff']

  return (
    <div className="edge-melody-viewer">
      {/* 3D 캔버스 */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#000000']} />

          {/* 조명 */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ccff" />

          {/* Edge Melody 3D 객체 */}
          <EdgeMelody edges={edges} colorScheme={colorScheme} />

          {/* 컨트롤 */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* 문제 정보 오버레이 */}
      <div className="question-overlay">
        <div className="question-header">
          <span className="question-type">{questionData.qtype || 'Question'}</span>
          <span className="question-points">{questionData.defaultmark || 0}점</span>
        </div>

        <div className="question-content">
          <h3>{questionData.name}</h3>
          <p>{questionData.questiontext}</p>
        </div>

        {questionData.answers && questionData.answers.length > 0 && (
          <div className="question-answers">
            <h4>선택지:</h4>
            <ul>
              {questionData.answers.map((answer, index) => (
                <li
                  key={answer.id}
                  className={answer.fraction > 0 ? 'correct' : ''}
                >
                  <span className="answer-number">{index + 1}</span>
                  <span className="answer-text">{answer.answer}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default EdgeMelodyViewer
