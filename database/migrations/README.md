# Database Migrations

## PostgreSQL 데이터베이스 설정

### 1. PostgreSQL 설치 및 시작

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Docker
docker run --name alt42-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 생성
CREATE DATABASE alt42_db;

# 사용자 생성 (옵션)
CREATE USER alt42_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE alt42_db TO alt42_user;

# 종료
\q
```

### 3. 스키마 적용

```bash
# 스키마 파일 실행
psql -U postgres -d alt42_db -f ../schemas/01_init.sql
```

### 4. 연결 확인

```bash
# 테이블 확인
psql -U postgres -d alt42_db -c "\dt"

# 데이터 확인
psql -U postgres -d alt42_db -c "SELECT * FROM modules;"
```

## Moodle LMS 연동 (향후)

Moodle 데이터베이스와의 연동을 위해 다음 옵션을 고려:

1. **Foreign Data Wrapper (FDW)**: PostgreSQL의 FDW를 사용하여 Moodle MySQL DB와 직접 연결
2. **REST API**: Moodle Web Services API를 통한 데이터 동기화
3. **LTI 통합**: LTI (Learning Tools Interoperability) 프로토콜 사용

### Moodle Web Services 설정 예시

```php
// Moodle 설정에서 활성화:
// Site administration > Plugins > Web services > Manage protocols
// - REST protocol 활성화
// - Token 생성
```

## 백업 및 복구

```bash
# 백업
pg_dump -U postgres alt42_db > backup.sql

# 복구
psql -U postgres -d alt42_db < backup.sql
```
