FROM node:18-alpine as development

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 애플리케이션 코드 복사
COPY . .

# 개발 서버 실행
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine as production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

# Nginx for serving
FROM nginx:alpine
COPY --from=production /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
