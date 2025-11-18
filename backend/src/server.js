import app from './app.js';
import { testConnection } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * 서버 시작
 */
async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    console.log('🔍 데이터베이스 연결 테스트 중...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ 데이터베이스 연결에 실패했습니다.');
      console.log('💡 .env 파일의 DB 설정을 확인해주세요.');
      process.exit(1);
    }

    // 환경 변수 확인
    console.log('🔍 환경 설정 확인 중...');
    const requiredEnvVars = [
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'MOODLE_URL',
      'MOODLE_TOKEN',
      'ANTHROPIC_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.warn('⚠️  다음 환경 변수가 설정되지 않았습니다:');
      missingVars.forEach(varName => console.warn(`   - ${varName}`));
      console.log('💡 .env 파일을 확인하고 필요한 값을 설정해주세요.');
    }

    // 서버 시작
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 서버가 시작되었습니다!');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('📚 API 엔드포인트:');
      console.log(`   - GET  /health`);
      console.log(`   - GET  /api/problems/today/:moodleUserId`);
      console.log(`   - GET  /api/problems/student/:studentId/today`);
      console.log(`   - GET  /api/analytics/student/:studentId/summary`);
      console.log(`   - GET  /api/analytics/student/:studentId/pattern`);
      console.log('');
      console.log('✨ 준비 완료! 요청을 받을 수 있습니다.');
      console.log('');
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n서버를 종료합니다...');
  process.exit(0);
});

// 서버 시작
startServer();
