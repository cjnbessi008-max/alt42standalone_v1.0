import fs from 'fs';
import path from 'path';
import pool from '../config/database';

const runMigration = async () => {
  try {
    console.log('Starting database migration...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✅ Database migration completed successfully!');
    console.log('Tables created:');
    console.log('  - students');
    console.log('  - learning_sessions');
    console.log('  - emotion_records');
    console.log('  - daily_emotion_summaries');
    console.log('  - lms_integrations');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
