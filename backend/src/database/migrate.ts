import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function migrate() {
  console.log('🔄 Starting database migration...\n');

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../../..', 'database/schemas/distraction_detection.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // First create core tables (teachers, students, modules)
    console.log('📋 Creating core tables...');
    await pool.query(`
      -- Teachers table
      CREATE TABLE IF NOT EXISTS teachers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'system_maintainer')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Students table
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        grade_level INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Modules table
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        teacher_id UUID REFERENCES teachers(id),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('generating', 'active', 'archived')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Student enrollment
      CREATE TABLE IF NOT EXISTS student_enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(student_id, module_id)
      );
    `);
    console.log('✅ Core tables created\n');

    // Now execute the distraction detection schema
    console.log('📋 Creating distraction detection tables...');
    await pool.query(schema);
    console.log('✅ Distraction detection tables created\n');

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
