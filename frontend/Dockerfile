# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Package files 복사
COPY package*.json ./

# Dependencies 설치
RUN npm ci

# 소스 코드 복사
COPY src ./src
COPY public ./public

# 빌드
RUN npm run build

# Production stage
FROM nginx:alpine

# 빌드된 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# Nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"]
