require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function seed() {
  let connection;

  try {
    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alt42_standalone',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // 시드 파일 읽기
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedData = await fs.readFile(seedPath, 'utf8');

    // 시드 데이터 실행
    await connection.query(seedData);
    console.log('✅ Seed data inserted successfully');

    // 데이터 확인
    const [rules] = await connection.query('SELECT COUNT(*) as count FROM solution_rules');
    const [timelines] = await connection.query('SELECT COUNT(*) as count FROM solve_timelines');
    const [steps] = await connection.query('SELECT COUNT(*) as count FROM solve_steps');

    console.log('\n📊 Seeded data:');
    console.log(`   - Solution rules: ${rules[0].count}`);
    console.log(`   - Timelines: ${timelines[0].count}`);
    console.log(`   - Steps: ${steps[0].count}`);

    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 실행
seed();
