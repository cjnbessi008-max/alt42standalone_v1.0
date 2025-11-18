/**
 * Unfolding Net Live - Polyhedron Geometry Component
 * 3D 도형을 렌더링하고 전개 애니메이션을 구현
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PolyhedronType } from '../../types/geometry';

interface PolyhedronGeometryProps {
  type: PolyhedronType;
  unfoldProgress: number; // 0 (folded) to 1 (unfolded)
  onFaceClick?: (faceIndex: number) => void;
  selectedFace?: number | null;
}

/**
 * 정육면체 전개 애니메이션
 * 각 면을 중심축을 기준으로 회전시켜 펼침
 */
const UnfoldingCube: React.FC<PolyhedronGeometryProps> = ({
  unfoldProgress,
  onFaceClick,
  selectedFace,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // 정육면체의 6개 면 정의
  const faces = useMemo(() => {
    const size = 1;
    const colors = [
      '#FF6B6B', // 앞면 - 빨강
      '#4ECDC4', // 뒷면 - 청록
      '#45B7D1', // 윗면 - 파랑
      '#96CEB4', // 아랫면 - 초록
      '#FFEAA7', // 오른쪽 - 노랑
      '#DFE6E9', // 왼쪽 - 회색
    ];

    return [
      // 앞면 (기준면 - 움직이지 않음)
      { position: [0, 0, size / 2], rotation: [0, 0, 0], axis: 'none', color: colors[0] },

      // 뒷면 (앞면 기준 180도 펼침)
      { position: [0, 0, -size / 2], rotation: [0, Math.PI, 0], axis: 'y', color: colors[1] },

      // 윗면 (앞면 위쪽으로 펼침)
      { position: [0, size / 2, 0], rotation: [-Math.PI / 2, 0, 0], axis: 'x', color: colors[2] },

      // 아랫면 (앞면 아래쪽으로 펼침)
      { position: [0, -size / 2, 0], rotation: [Math.PI / 2, 0, 0], axis: 'x', color: colors[3] },

      // 오른쪽 면 (앞면 오른쪽으로 펼침)
      { position: [size / 2, 0, 0], rotation: [0, Math.PI / 2, 0], axis: 'y', color: colors[4] },

      // 왼쪽 면 (앞면 왼쪽으로 펼침)
      { position: [-size / 2, 0, 0], rotation: [0, -Math.PI / 2, 0], axis: 'y', color: colors[5] },
    ];
  }, []);

  // 각 면의 전개 각도 계산
  const calculateUnfoldRotation = (face: any, progress: number) => {
    const maxAngle = Math.PI / 2; // 90도 펼침

    if (face.axis === 'none') {
      return face.rotation;
    }

    const unfoldAngle = progress * maxAngle;
    const rotation = [...face.rotation] as [number, number, number];

    if (face.axis === 'x') {
      rotation[0] += unfoldAngle * (rotation[0] > 0 ? 1 : -1);
    } else if (face.axis === 'y') {
      rotation[1] += unfoldAngle * (rotation[1] > 0 ? 1 : -1);
    }

    return rotation;
  };

  return (
    <group ref={groupRef}>
      {faces.map((face, index) => {
        const isSelected = selectedFace === index;
        const rotation = calculateUnfoldRotation(face, unfoldProgress);

        return (
          <mesh
            key={index}
            position={face.position as [number, number, number]}
            rotation={rotation}
            onClick={(e) => {
              e.stopPropagation();
              onFaceClick?.(index);
            }}
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={face.color}
              side={THREE.DoubleSide}
              emissive={isSelected ? face.color : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
              opacity={0.9}
              transparent
            />
            {/* 면의 테두리 */}
            <lineSegments>
              <edgesGeometry
                args={[new THREE.PlaneGeometry(1, 1)]}
              />
              <lineBasicMaterial color="#333333" linewidth={2} />
            </lineSegments>
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * 사면체 전개 애니메이션
 */
const UnfoldingTetrahedron: React.FC<PolyhedronGeometryProps> = ({
  unfoldProgress,
  onFaceClick,
  selectedFace,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => new THREE.TetrahedronGeometry(1), []);

  // 사면체는 4개의 면
  const faceColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  useFrame(() => {
    if (groupRef.current) {
      // 간단한 회전 애니메이션 (실제 전개 애니메이션은 복잡함)
      groupRef.current.rotation.y = unfoldProgress * Math.PI;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onFaceClick?.(0);
        }}
      >
        <meshStandardMaterial
          color={faceColors[0]}
          vertexColors
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * 메인 Polyhedron 컴포넌트
 * 도형 타입에 따라 적절한 컴포넌트 렌더링
 */
export const PolyhedronGeometry: React.FC<PolyhedronGeometryProps> = (props) => {
  switch (props.type) {
    case PolyhedronType.CUBE:
      return <UnfoldingCube {...props} />;

    case PolyhedronType.TETRAHEDRON:
      return <UnfoldingTetrahedron {...props} />;

    // 다른 도형들은 추후 구현
    default:
      return <UnfoldingCube {...props} />;
  }
};
