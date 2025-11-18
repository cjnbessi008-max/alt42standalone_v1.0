# Node.js 18 LTS 기반
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 로그 디렉토리 생성
RUN mkdir -p logs

# 포트 노출
EXPOSE 5000

# 헬스체크용 curl 설치
RUN apk add --no-cache curl

# 애플리케이션 실행
CMD ["node", "src/server.js"]
