# Node.js 18 LTS 기반
FROM node:18-alpine as build

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Nginx를 사용하여 정적 파일 서빙
FROM nginx:alpine

# 빌드된 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 3000

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
