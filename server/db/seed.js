import pool from './connection.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...');

    await client.query('BEGIN');

    // 1. Create sample users
    console.log('👤 Creating sample users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const usersResult = await client.query(`
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES
        ('teacher1', 'teacher@example.com', $1, 'teacher', '김선생'),
        ('student1', 'student1@example.com', $1, 'student', '이학생'),
        ('student2', 'student2@example.com', $1, 'student', '박학생'),
        ('admin', 'admin@example.com', $1, 'admin', '관리자')
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, [passwordHash]);

    // 2. Create 3D shapes
    console.log('📦 Creating 3D shapes...');
    await client.query(`
      INSERT INTO shapes_3d (name, name_ko, category, properties)
      VALUES
        ('Cube', '정육면체', 'polyhedron', '{"vertices": 8, "edges": 12, "faces": 6}'::jsonb),
        ('Sphere', '구', 'curved', '{"radius": 1}'::jsonb),
        ('Cylinder', '원기둥', 'curved', '{"radius": 1, "height": 2}'::jsonb),
        ('Cone', '원뿔', 'curved', '{"radius": 1, "height": 2}'::jsonb),
        ('Rectangular Prism', '직육면체', 'polyhedron', '{"length": 2, "width": 1, "height": 1}'::jsonb),
        ('Pyramid', '각뿔', 'polyhedron', '{"base": "square", "height": 2}'::jsonb)
      ON CONFLICT DO NOTHING
    `);

    // 3. Create 2D shapes
    console.log('📐 Creating 2D shapes...');
    await client.query(`
      INSERT INTO shapes_2d (name, name_ko, shape_type, properties)
      VALUES
        ('Square', '정사각형', 'polygon', '{"sides": 4, "regular": true}'::jsonb),
        ('Circle', '원', 'curved', '{"radius": 1}'::jsonb),
        ('Rectangle', '직사각형', 'polygon', '{"sides": 4, "regular": false}'::jsonb),
        ('Triangle', '삼각형', 'polygon', '{"sides": 3}'::jsonb),
        ('Pentagon', '오각형', 'polygon', '{"sides": 5, "regular": true}'::jsonb),
        ('Hexagon', '육각형', 'polygon', '{"sides": 6, "regular": true}'::jsonb)
      ON CONFLICT DO NOTHING
    `);

    // 4. Create sample problem
    console.log('🎯 Creating sample problems...');
    const problemResult = await client.query(`
      INSERT INTO problems (
        title, title_ko,
        description, description_ko,
        difficulty_level, category,
        instructions, instructions_ko,
        time_limit_seconds, created_by
      )
      VALUES (
        'Basic 3D to 2D Matching',
        '기본 입체도형과 평면도형 매칭',
        'Match 3D shapes with their corresponding 2D cross-sections',
        '입체도형과 그에 대응하는 평면도형의 단면을 매칭하세요',
        1,
        'geometry_basics',
        'Touch and drag each 3D shape to its matching 2D shape',
        '각 입체도형을 손가락으로 터치하여 해당하는 평면도형으로 드래그하세요',
        300,
        1
      )
      RETURNING id
    `);

    const problemId = problemResult.rows[0].id;

    // 5. Create problem pairs (correct matches)
    console.log('🔗 Creating problem pairs...');
    await client.query(`
      INSERT INTO problem_pairs (problem_id, shape_3d_id, shape_2d_id, is_correct_match, display_order)
      VALUES
        ($1, 1, 1, true, 1),   -- Cube -> Square
        ($1, 2, 2, true, 2),   -- Sphere -> Circle
        ($1, 3, 2, true, 3),   -- Cylinder -> Circle
        ($1, 4, 3, true, 4),   -- Cone -> Triangle (side view)
        ($1, 5, 3, true, 5),   -- Rectangular Prism -> Rectangle
        ($1, 6, 4, true, 6)    -- Pyramid -> Triangle
    `, [problemId]);

    // Add some incorrect pairs as distractors
    await client.query(`
      INSERT INTO problem_pairs (problem_id, shape_3d_id, shape_2d_id, is_correct_match, display_order)
      VALUES
        ($1, 1, 2, false, 7),  -- Cube -> Circle (incorrect)
        ($1, 2, 1, false, 8),  -- Sphere -> Square (incorrect)
        ($1, 3, 4, false, 9)   -- Cylinder -> Triangle (incorrect)
    `, [problemId]);

    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');

    console.log('\n📊 Seed Summary:');
    console.log('- 4 users created');
    console.log('- 6 3D shapes created');
    console.log('- 6 2D shapes created');
    console.log('- 1 problem created with 9 matching pairs');
    console.log('\n🔐 Test credentials:');
    console.log('Teacher: teacher1 / password123');
    console.log('Student: student1 / password123');
    console.log('Admin: admin / password123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
