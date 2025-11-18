/**
 * Cross-Section Glow 효과를 위한 Custom Shaders
 *
 * Vertex Shader와 Fragment Shader를 정의하여
 * 단면이 잘릴 때 빛나는 효과를 생성합니다.
 */

const GlowShaders = {
    // Vertex Shader - 정점 변환 및 데이터 전달
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
            // 노멀 벡터 전달 (월드 공간)
            vNormal = normalize(normalMatrix * normal);

            // 로컬 위치
            vPosition = position;

            // 월드 위치 계산
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;

            // 최종 위치 계산
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    // Fragment Shader - Cross-Section Glow 효과
    fragmentShader: `
        uniform vec3 clipPlaneNormal;
        uniform float clipPlaneConstant;
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform float glowThickness;
        uniform vec3 baseColor;
        uniform float metalness;
        uniform float roughness;
        uniform bool enableCrossSection;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
            // 기본 재질 색상
            vec3 finalColor = baseColor;
            float alpha = 1.0;

            if (enableCrossSection) {
                // 클리핑 평면과의 거리 계산
                float distance = dot(vWorldPosition, clipPlaneNormal) + clipPlaneConstant;

                // 클리핑 평면 뒤쪽은 버림
                if (distance < 0.0) {
                    discard;
                }

                // Glow 효과 계산
                // 단면 가까이에서 빛남
                float glowFactor = smoothstep(glowThickness, 0.0, distance);

                // 펄스 효과 추가 (시간에 따라 변하는 효과)
                float pulse = 0.5 + 0.5 * sin(distance * 20.0);
                glowFactor *= pulse;

                // 최종 색상에 Glow 적용
                vec3 glow = glowColor * glowIntensity * glowFactor;
                finalColor = mix(finalColor, glowColor, glowFactor * 0.8);
                finalColor += glow;

                // 빛나는 부분의 투명도 조절
                alpha = 1.0;
            }

            // 간단한 램버트 라이팅
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diffuse = max(dot(vNormal, lightDir), 0.3);

            finalColor *= diffuse;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `,

    // 단순한 Glow 효과 (단면 가장자리만)
    simpleGlowFragmentShader: `
        uniform vec3 clipPlaneNormal;
        uniform float clipPlaneConstant;
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform float glowThickness;
        uniform vec3 baseColor;
        uniform bool enableCrossSection;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
            vec3 finalColor = baseColor;

            if (enableCrossSection) {
                // 클리핑 평면과의 거리
                float distance = dot(vWorldPosition, clipPlaneNormal) + clipPlaneConstant;

                // 뒤쪽 버림
                if (distance < 0.0) {
                    discard;
                }

                // 단면 가장자리에만 Glow
                if (distance < glowThickness) {
                    float edgeFactor = 1.0 - (distance / glowThickness);
                    finalColor = mix(baseColor, glowColor * glowIntensity, edgeFactor);
                }
            }

            // 라이팅
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diffuse = max(dot(vNormal, lightDir), 0.3);
            finalColor *= diffuse;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,

    // 애니메이션 Glow 효과
    animatedGlowFragmentShader: `
        uniform vec3 clipPlaneNormal;
        uniform float clipPlaneConstant;
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform float glowThickness;
        uniform vec3 baseColor;
        uniform bool enableCrossSection;
        uniform float time;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
            vec3 finalColor = baseColor;

            if (enableCrossSection) {
                float distance = dot(vWorldPosition, clipPlaneNormal) + clipPlaneConstant;

                if (distance < 0.0) {
                    discard;
                }

                // 애니메이션 Glow
                if (distance < glowThickness) {
                    float edgeFactor = 1.0 - (distance / glowThickness);

                    // 시간 기반 펄스
                    float pulse = 0.7 + 0.3 * sin(time * 3.0);

                    // 위치 기반 파동 효과
                    float wave = sin(distance * 50.0 - time * 5.0) * 0.5 + 0.5;

                    float combinedEffect = edgeFactor * pulse * (0.7 + wave * 0.3);

                    vec3 glowEffect = glowColor * glowIntensity * combinedEffect;
                    finalColor = mix(baseColor, glowEffect, combinedEffect * 0.9);
                    finalColor += glowEffect * 0.5;
                }
            }

            // 라이팅
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diffuse = max(dot(vNormal, lightDir), 0.3);
            finalColor *= diffuse;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

/**
 * Glow Material을 생성하는 헬퍼 함수
 */
function createGlowMaterial(options = {}) {
    const defaults = {
        baseColor: new THREE.Color(0x4488ff),
        glowColor: new THREE.Color(0x00ffff),
        glowIntensity: 2.0,
        glowThickness: 0.1,
        clipPlaneNormal: new THREE.Vector3(0, 1, 0),
        clipPlaneConstant: 0,
        enableCrossSection: true,
        useAnimation: false
    };

    const settings = { ...defaults, ...options };

    // Fragment Shader 선택
    const fragmentShader = settings.useAnimation
        ? GlowShaders.animatedGlowFragmentShader
        : GlowShaders.fragmentShader;

    const uniforms = {
        baseColor: { value: settings.baseColor },
        glowColor: { value: settings.glowColor },
        glowIntensity: { value: settings.glowIntensity },
        glowThickness: { value: settings.glowThickness },
        clipPlaneNormal: { value: settings.clipPlaneNormal },
        clipPlaneConstant: { value: settings.clipPlaneConstant },
        enableCrossSection: { value: settings.enableCrossSection },
        metalness: { value: 0.3 },
        roughness: { value: 0.7 }
    };

    // 애니메이션 사용 시 time uniform 추가
    if (settings.useAnimation) {
        uniforms.time = { value: 0 };
    }

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: GlowShaders.vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide,
        transparent: false
    });
}
