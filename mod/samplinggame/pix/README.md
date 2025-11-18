# Icon Directory

이 디렉토리는 Sampling Game 플러그인의 아이콘 파일을 포함합니다.

## 필요한 파일

### icon.png (필수)
- **크기**: 최소 24x24 픽셀
- **권장 크기**: 64x64 픽셀
- **포맷**: PNG (투명 배경 권장)
- **용도**: Moodle 활동 목록에 표시되는 아이콘

### icon.svg (권장)
- **포맷**: SVG
- **용도**: 확장 가능한 벡터 아이콘
- **이점**: 모든 해상도에서 선명함

## 아이콘 디자인 가이드라인

### 테마
표본추출과 통계를 나타내는 아이콘:
- 📊 그래프/차트
- 🎯 타겟/샘플링
- 📱 스마트폰 (게임 인터페이스 반영)
- 🎲 주사위 (무작위성)
- 👥 사람들 (모집단)

### 색상
- **주 색상**: #667eea (보라-파랑)
- **보조 색상**: #764ba2 (보라)
- **강조 색상**: #f5576c (분홍-빨강)

### 스타일
- 심플하고 깔끔한 디자인
- Moodle 기본 아이콘 스타일과 조화
- 24x24 픽셀에서도 인식 가능한 디자인

## 임시 아이콘 생성

현재 아이콘이 없는 경우, Moodle은 기본 활동 아이콘을 사용합니다.

커스텀 아이콘을 만들려면:

### 방법 1: 온라인 도구 사용
1. [Canva](https://www.canva.com) 또는 [Figma](https://www.figma.com)
2. 64x64 픽셀 캔버스 생성
3. 위의 가이드라인에 따라 디자인
4. PNG로 내보내기

### 방법 2: ImageMagick 사용
```bash
# 단순한 placeholder 생성
convert -size 64x64 xc:#667eea \
    -gravity center \
    -pointsize 32 \
    -fill white \
    -annotate +0+0 "SG" \
    icon.png
```

### 방법 3: SVG 코드
```svg
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="8" fill="#667eea"/>
  <circle cx="32" cy="20" r="8" fill="white"/>
  <circle cx="20" cy="44" r="6" fill="#f5576c"/>
  <circle cx="32" cy="44" r="6" fill="#f5576c"/>
  <circle cx="44" cy="44" r="6" fill="white"/>
  <line x1="32" y1="28" x2="32" y2="38" stroke="white" stroke-width="2"/>
</svg>
```

## 설치

아이콘 파일을 이 디렉토리에 복사:
```bash
cp your-icon.png mod/samplinggame/pix/icon.png
```

Moodle 캐시 클리어:
```
사이트 관리 → 개발 → 캐시 삭제
```
