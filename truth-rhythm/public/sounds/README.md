# Truth Rhythm - Sound Files

이 디렉토리는 Truth Rhythm 앱에서 사용되는 리듬 사운드 파일을 포함합니다.

## 필요한 사운드 파일

### 1. true-rhythm.mp3
- **용도**: 정답일 때 재생되는 리듬
- **특징**: 경쾌하고 긍정적인 리듬 패턴
- **권장 사양**:
  - BPM: 120-140
  - 길이: 2-3초
  - 포맷: MP3 (128kbps 이상)
  - 분위기: 밝고 활기찬 톤

### 2. false-rhythm.mp3
- **용도**: 오답일 때 재생되는 리듬
- **특징**: 신중하고 생각을 유도하는 리듬 패턴
- **권장 사양**:
  - BPM: 80-100
  - 길이: 2-3초
  - 포맷: MP3 (128kbps 이상)
  - 분위기: 차분하고 성찰적인 톤

## 사운드 파일 준비 방법

### 옵션 1: 직접 제작

음악 제작 소프트웨어 (GarageBand, FL Studio, Ableton Live 등)를 사용하여 리듬을 직접 제작할 수 있습니다.

**정답 리듬 예시 패턴**:
```
C5 - E5 - G5 - C6 (상승하는 코드)
♩  ♩  ♩  ♪  (4분음표 3개 + 8분음표)
```

**오답 리듬 예시 패턴**:
```
D4 - B3 - A3 (하강하는 패턴)
♩  ♩  𝅗𝅥  (4분음표 2개 + 2분음표)
```

### 옵션 2: 무료 사운드 라이브러리

다음 사이트에서 무료 또는 CC 라이선스 사운드를 다운로드할 수 있습니다:

- **Freesound** (https://freesound.org/)
  - 검색어: "positive rhythm", "success sound", "error tone"

- **Zapsplat** (https://www.zapsplat.com/)
  - 카테고리: Game Sounds > UI

- **Mixkit** (https://mixkit.co/free-sound-effects/)
  - 카테고리: Game, UI

### 옵션 3: Web Audio API (기본 제공)

사운드 파일이 없어도 앱은 Web Audio API를 통해 프로그래밍 방식으로 리듬을 생성합니다.

`js/sound.js`의 `SoundManager` 클래스가 다음 기능을 제공합니다:
- `createTrueRhythm()`: 정답 리듬 자동 생성
- `createFalseRhythm()`: 오답 리듬 자동 생성

## 사운드 파일 설치

1. 사운드 파일을 이 디렉토리(`public/sounds/`)에 복사
2. 파일명이 정확한지 확인:
   - `true-rhythm.mp3`
   - `false-rhythm.mp3`
3. 파일 권한 설정:
   ```bash
   chmod 644 true-rhythm.mp3
   chmod 644 false-rhythm.mp3
   ```

## 커스텀 사운드 사용

다른 사운드를 사용하려면:

1. 사운드 파일을 이 디렉토리에 추가
2. 데이터베이스의 `questions` 테이블 또는 `rhythm_patterns` 테이블에서 파일명 변경:

```sql
-- 특정 문제의 사운드 변경
UPDATE questions
SET sound_true = 'custom-true.mp3',
    sound_false = 'custom-false.mp3'
WHERE id = 1;

-- 기본 리듬 패턴 변경
UPDATE rhythm_patterns
SET sound_file = 'custom-true.mp3'
WHERE pattern_type = 'true' AND is_default = 1;
```

## 파일 형식 지원

지원되는 오디오 형식:
- **MP3** (권장): 가장 널리 지원됨
- **OGG**: Firefox에서 더 나은 성능
- **WAV**: 무손실 품질 (파일 크기 큼)
- **M4A/AAC**: iOS/Safari에서 최적

크로스 브라우저 호환성을 위해 MP3 형식을 권장합니다.

## 사운드 최적화

### 파일 크기 최적화

```bash
# FFmpeg를 사용한 압축
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k true-rhythm.mp3

# 길이 조정 (처음 2초만)
ffmpeg -i input.mp3 -t 2 -codec:a copy output.mp3
```

### 볼륨 정규화

```bash
# FFmpeg로 볼륨 정규화
ffmpeg -i input.mp3 -filter:a "volume=1.5" output.mp3
```

## 라이선스

사운드 파일을 사용할 때는 저작권과 라이선스를 확인하세요.

- 자체 제작 사운드: 자유롭게 사용 가능
- CC0/Public Domain: 제한 없이 사용 가능
- CC BY: 출처 표기 필요
- 상업용 라이선스: 구매 필요

## 문제 해결

### 사운드가 재생되지 않는 경우

1. 파일명 확인 (`true-rhythm.mp3`, `false-rhythm.mp3`)
2. 파일 경로 확인 (`public/sounds/` 디렉토리)
3. 브라우저 콘솔에서 오류 메시지 확인
4. 브라우저의 자동재생 정책 확인 (사용자 인터랙션 필요)
5. Web Audio API 폴백이 작동하는지 확인

### 사운드 품질 문제

1. 비트레이트 확인 (최소 128kbps 권장)
2. 샘플레이트 확인 (44.1kHz 권장)
3. 잡음 제거 (Audacity 등 사용)

## 추천 도구

- **Audacity** (무료): 오디오 편집
- **FFmpeg** (무료): 포맷 변환 및 압축
- **LMMS** (무료): 리듬 제작
- **GarageBand** (Mac 무료): 음악 제작

## 예시 사운드 제작 가이드

### GarageBand로 정답 리듬 만들기

1. 새 프로젝트 생성 (템포: 120 BPM)
2. Software Instrument 트랙 추가
3. 피아노 선택
4. 다음 노트 입력:
   - C5 (0초)
   - E5 (0.5초)
   - G5 (1.0초)
   - C6 (1.5초)
5. MP3로 내보내기

### Audacity로 사운드 편집

1. 사운드 파일 가져오기
2. 효과 > 정규화 적용
3. 불필요한 부분 자르기 (2-3초로)
4. 페이드 인/아웃 적용
5. MP3로 내보내기 (128kbps)

---

사운드 파일 관련 문의사항이 있으면 프로젝트 이슈에 남겨주세요.
