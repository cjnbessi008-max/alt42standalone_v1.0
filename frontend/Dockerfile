FROM node:18-alpine as build

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 애플리케이션 빌드
COPY . .
RUN npm run build

# Nginx로 서빙
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
