# 배포 가이드

이 문서는 Reflection Pair 웹앱을 다양한 플랫폼에 배포하는 방법을 설명합니다.

## 📦 빌드

모든 배포 전에 프로덕션 빌드를 생성해야 합니다:

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

## 🚀 배포 플랫폼

### 1. Vercel (추천 ⭐)

가장 쉽고 빠른 배포 방법입니다.

#### 방법 A: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 방법 B: GitHub 연동

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com) 방문
3. "Import Project" 클릭
4. GitHub 저장소 선택
5. Framework Preset: Vite 선택
6. Deploy 클릭

**자동 배포**: 이후 `main` 브랜치에 푸시할 때마다 자동 배포됩니다.

#### 커스텀 도메인 설정

Vercel 대시보드에서:
1. Project Settings → Domains
2. 도메인 입력 (예: reflection-pair.com)
3. DNS 레코드 추가

---

### 2. Netlify

#### 방법 A: Netlify CLI

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 배포
netlify deploy --prod --dir=dist
```

#### 방법 B: 드래그 앤 드롭

1. [Netlify](https://app.netlify.com) 방문
2. `dist/` 폴더를 드래그 앤 드롭

#### netlify.toml 설정 (선택)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 3. GitHub Pages

#### 1단계: vite.config.ts 수정

```typescript
export default defineConfig({
  base: '/reflection-pair-webapp/',  // 저장소 이름
  // ...
})
```

#### 2단계: 배포 스크립트

`package.json`에 추가:

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.0.0"
  }
}
```

#### 3단계: 배포

```bash
# gh-pages 설치
npm install -D gh-pages

# 배포
npm run deploy
```

#### 4단계: GitHub 설정

1. 저장소 → Settings → Pages
2. Source: `gh-pages` 브랜치 선택
3. Save

**URL**: `https://username.github.io/reflection-pair-webapp/`

---

### 4. Firebase Hosting

#### 1단계: Firebase 설정

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 초기화
firebase init hosting
```

설정:
- Public directory: `dist`
- Single-page app: Yes
- GitHub 자동 배포: 선택사항

#### 2단계: 배포

```bash
# 빌드
npm run build

# 배포
firebase deploy
```

#### firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### 5. AWS S3 + CloudFront

#### 1단계: S3 버킷 생성

```bash
# AWS CLI 설치
aws configure

# 버킷 생성
aws s3 mb s3://reflection-pair-webapp

# 정적 웹사이트 호스팅 활성화
aws s3 website s3://reflection-pair-webapp \
  --index-document index.html \
  --error-document index.html
```

#### 2단계: 빌드 및 업로드

```bash
# 빌드
npm run build

# S3에 업로드
aws s3 sync dist/ s3://reflection-pair-webapp --delete

# 퍼블릭 액세스 설정
aws s3api put-bucket-policy \
  --bucket reflection-pair-webapp \
  --policy file://policy.json
```

**policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::reflection-pair-webapp/*"
    }
  ]
}
```

#### 3단계: CloudFront 설정

1. AWS Console → CloudFront
2. Create Distribution
3. Origin: S3 버킷 선택
4. Default Root Object: `index.html`
5. Create

---

### 6. Azure Static Web Apps

#### 1단계: Azure CLI

```bash
# Azure CLI 설치
az login

# Static Web App 생성
az staticwebapp create \
  --name reflection-pair \
  --resource-group my-resource-group \
  --source .
```

#### 2단계: GitHub Actions

Azure가 자동으로 `.github/workflows/` 생성

#### staticwebapp.config.json

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*"]
  }
}
```

---

### 7. Cloudflare Pages

#### 방법 A: Dashboard

1. [Cloudflare Pages](https://pages.cloudflare.com) 방문
2. "Create a project" 클릭
3. GitHub 저장소 연결
4. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Deploy

#### 방법 B: Wrangler CLI

```bash
# Wrangler 설치
npm install -g wrangler

# 로그인
wrangler login

# 배포
wrangler pages publish dist --project-name=reflection-pair
```

---

## 🔧 환경 변수

배포 시 환경 변수가 필요한 경우:

### Vercel
```bash
vercel env add API_KEY production
```

### Netlify
```bash
netlify env:set API_KEY "value"
```

### Vite에서 사용
```typescript
const apiKey = import.meta.env.VITE_API_KEY
```

---

## 🌐 커스텀 도메인

### DNS 설정

#### A 레코드 (IP)
```
Type: A
Name: @
Value: [서버 IP]
TTL: 3600
```

#### CNAME (별칭)
```
Type: CNAME
Name: www
Value: your-app.vercel.app
TTL: 3600
```

### SSL 인증서

대부분의 플랫폼이 자동 제공:
- ✅ Vercel: Let's Encrypt 자동
- ✅ Netlify: Let's Encrypt 자동
- ✅ Cloudflare: 자동 HTTPS

---

## 📊 성능 최적화

### 1. 압축

대부분 플랫폼이 자동 지원:
- Gzip
- Brotli

### 2. CDN 캐싱

**Headers 설정** (예: Netlify):

`_headers`:
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

### 3. 이미지 최적화

Vite 자동 처리:
- SVG 최적화
- Asset hashing

---

## 🐛 문제 해결

### 빌드 실패

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run build -- --force
```

### SPA 라우팅 오류

404 에러 발생 시:

**Vercel**: `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify**: `_redirects`
```
/*    /index.html   200
```

### CORS 에러

API 호출 시:
- 백엔드에서 CORS 헤더 설정
- Proxy 사용 (Vite 개발 모드)

---

## 📈 모니터링

### Analytics 추가

#### Google Analytics

`index.html`에:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

#### Vercel Analytics

```bash
npm install @vercel/analytics
```

`main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

<Analytics />
```

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] `npm run build` 성공
- [ ] `npm run preview`로 로컬 테스트
- [ ] 환경 변수 설정
- [ ] 도메인 DNS 설정
- [ ] SSL 인증서 확인
- [ ] 모바일 반응형 테스트
- [ ] 크로스 브라우저 테스트
- [ ] 404 페이지 처리
- [ ] Analytics 설정

---

## 🎉 완료!

배포가 완료되면:
1. URL 테스트
2. 성능 측정 (Lighthouse)
3. 모니터링 설정
4. 문서 업데이트

---

**추가 도움이 필요하시면 이슈를 생성해주세요!**
