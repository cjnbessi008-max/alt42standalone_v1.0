import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('🔧 Initializing Wave Derivative Database...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    console.log('📝 Creating tables and inserting sample data...');
    await pool.query(schema);

    console.log('✅ Database initialized successfully!\n');
    console.log('📊 Sample data has been inserted:');
    console.log('   - 2 teachers');
    console.log('   - 2 modules');
    console.log('   - 4 sample problems\n');

    // Verify the setup
    const result = await pool.query('SELECT COUNT(*) FROM problems');
    console.log(`✨ Total problems in database: ${result.rows[0].count}\n`);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
