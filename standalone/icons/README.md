# Icons Directory

이 디렉토리에는 PWA 앱 아이콘이 위치합니다.

## 필요한 아이콘 크기

- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

## 아이콘 생성 방법

### 온라인 도구 사용

1. **Favicon Generator**: https://realfavicongenerator.net/
2. **PWA Builder**: https://www.pwabuilder.com/imageGenerator
3. **App Icon Generator**: https://appicon.co/

### 로컬에서 생성 (ImageMagick)

```bash
# 512x512 소스 이미지가 있다면
convert source.png -resize 72x72 icon-72.png
convert source.png -resize 96x96 icon-96.png
convert source.png -resize 128x128 icon-128.png
convert source.png -resize 144x144 icon-144.png
convert source.png -resize 152x152 icon-152.png
convert source.png -resize 192x192 icon-192.png
convert source.png -resize 384x384 icon-384.png
convert source.png -resize 512x512 icon-512.png
```

## 디자인 가이드

- 배경: 투명 또는 앱 테마 색상 (#667eea)
- 주요 요소: 기하학적 도형 (삼각형, 사각형 등)
- 스타일: 심플하고 인식하기 쉬운 디자인
- 여백: 각 방향 10% 정도 여백 유지

## 임시 아이콘

아이콘이 없는 경우 다음 단계로 임시 사용:

1. 온라인 플레이스홀더 서비스:
   - https://via.placeholder.com/192
   - https://placehold.co/192x192/667eea/white

2. 또는 간단한 SVG 아이콘 생성

아이콘이 없어도 앱은 정상 작동하나, PWA 설치 시 경고가 표시될 수 있습니다.
