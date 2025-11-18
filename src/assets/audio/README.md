# Audio Assets

## Area Chime Sound

조용한 종소리 파일이 필요합니다.

### 파일명
- `area-chime.mp3` (권장)
- `area-chime.ogg` (대체 포맷)

### 사운드 특성
- **길이**: 1-3초
- **볼륨**: 조용함 (부드러운 종소리)
- **용도**: 넓이 계산 완성 시 재생

### 무료 사운드 다운로드 출처
1. **Freesound.org**: https://freesound.org/ (검색어: "chime", "bell", "soft bell")
2. **Zapsplat**: https://www.zapsplat.com/ (무료 계정 필요)
3. **Mixkit**: https://mixkit.co/free-sound-effects/

### 파일 추가 방법
다운로드한 오디오 파일을 이 디렉토리에 다음과 같이 배치:
```
src/assets/audio/
├── area-chime.mp3
└── area-chime.ogg (선택사항)
```

### 임시 테스트용
테스트를 위해 브라우저의 Web Audio API로 간단한 beep 사운드를 생성할 수 있습니다.
(실제 배포시에는 실제 오디오 파일 사용 권장)
