import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  let connection;

  try {
    console.log('🔧 데이터베이스 초기화 시작...\n');

    // MySQL 연결 (데이터베이스 지정 없이)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    console.log('✓ MySQL 서버 연결 성공');

    // schema.sql 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    console.log('✓ 스키마 파일 로드 완료');

    // 스키마 실행
    await connection.query(schema);

    console.log('✓ 데이터베이스 및 테이블 생성 완료');
    console.log('✓ 샘플 데이터 삽입 완료\n');

    console.log('📊 데이터베이스 상태:');

    // 테이블 목록 확인
    const [tables] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [process.env.DB_NAME || 'condition_scanner']
    );

    console.log(`  테이블 수: ${tables.length}`);
    tables.forEach((table) => {
      console.log(`    - ${table.TABLE_NAME}`);
    });

    // 샘플 데이터 확인
    await connection.query(`USE ${process.env.DB_NAME || 'condition_scanner'}`);
    const [activities] = await connection.query('SELECT COUNT(*) as count FROM activities');
    const [conditions] = await connection.query('SELECT COUNT(*) as count FROM conditions');

    console.log(`\n  데이터 현황:`);
    console.log(`    - activities: ${activities[0].count}개`);
    console.log(`    - conditions: ${conditions[0].count}개`);

    console.log('\n✅ 데이터베이스 초기화가 성공적으로 완료되었습니다!\n');
  } catch (error) {
    console.error('\n❌ 데이터베이스 초기화 실패:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 실행
initDatabase();
