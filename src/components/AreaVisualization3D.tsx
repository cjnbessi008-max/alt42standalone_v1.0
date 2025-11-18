import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Problem } from '../api/moodleApi'

interface AreaVisualization3DProps {
  problem: Problem
}

function Shape3D({ problem }: { problem: Problem }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { shape, params } = problem

  // 자동 회전 애니메이션
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })

  const shapeGeometry = useMemo(() => {
    switch (shape) {
      case 'rectangle':
        return (
          <boxGeometry
            args={[params.width || 1, 0.2, params.height || 1]}
          />
        )
      case 'square':
        return (
          <boxGeometry
            args={[params.side || 1, 0.2, params.side || 1]}
          />
        )
      case 'circle':
        return (
          <cylinderGeometry
            args={[params.radius || 1, params.radius || 1, 0.2, 32]}
          />
        )
      case 'triangle':
        const triangleShape = new THREE.Shape()
        const base = params.base || params.width || 2
        const height = params.height || 2
        triangleShape.moveTo(0, 0)
        triangleShape.lineTo(base, 0)
        triangleShape.lineTo(base / 2, height)
        triangleShape.lineTo(0, 0)

        return (
          <extrudeGeometry
            args={[
              triangleShape,
              {
                depth: 0.2,
                bevelEnabled: false,
              },
            ]}
          />
        )
      default:
        return <boxGeometry args={[1, 0.2, 1]} />
    }
  }, [shape, params])

  return (
    <group>
      {/* 메인 도형 */}
      <mesh ref={meshRef} castShadow receiveShadow position={[0, 0.1, 0]}>
        {shapeGeometry}
        <meshStandardMaterial
          color="#3b82f6"
          metalness={0.3}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 윤곽선 */}
      <mesh position={[0, 0.1, 0]}>
        {shapeGeometry}
        <meshBasicMaterial
          color="#1e40af"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 치수 표시 */}
      {shape === 'rectangle' && (
        <>
          <Text
            position={[params.width! / 2, 0.3, -params.height! / 2 - 0.5]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {`가로: ${params.width}cm`}
          </Text>
          <Text
            position={[-params.width! / 2 - 0.5, 0.3, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            rotation={[0, Math.PI / 2, 0]}
          >
            {`세로: ${params.height}cm`}
          </Text>
        </>
      )}

      {shape === 'square' && (
        <Text
          position={[params.side! / 2, 0.3, -params.side! / 2 - 0.5]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`한 변: ${params.side}cm`}
        </Text>
      )}

      {shape === 'circle' && (
        <>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {`반지름: ${params.radius}cm`}
          </Text>
          <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, params.radius!, 8]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        </>
      )}
    </group>
  )
}

export function AreaVisualization3D({ problem }: AreaVisualization3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
        className="bg-gradient-to-b from-gray-900 to-gray-800"
      >
        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#60a5fa" />

        {/* 3D 도형 */}
        <Shape3D problem={problem} />

        {/* 그리드 바닥 */}
        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9ca3af"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />

        {/* 컨트롤 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2}
        />

        {/* 배경 */}
        <color attach="background" args={['#111827']} />
      </Canvas>

      {/* 조작 안내 */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded-lg">
        <div>🖱️ 드래그: 회전</div>
        <div>🔍 휠: 확대/축소</div>
      </div>
    </div>
  )
}
