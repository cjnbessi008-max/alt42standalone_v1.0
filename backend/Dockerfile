FROM node:18-alpine

WORKDIR /app

# Package files 복사
COPY package*.json ./

# Dependencies 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY src ./src

# 포트 노출
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 시작
CMD ["node", "src/server.js"]
