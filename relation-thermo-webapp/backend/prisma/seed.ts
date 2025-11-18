import { PrismaClient, RelationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: hashedPassword,
      name: '김학생',
      role: 'STUDENT',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: hashedPassword,
      name: '이선생',
      role: 'TEACHER',
    },
  });

  console.log('✅ Created users:', { student: student.email, teacher: teacher.email });

  // Create sample problems
  const problems = [
    {
      title: '기본 부분집합',
      description: 'A의 모든 원소가 B에 포함되어 있는지 확인하세요.',
      setA: [1, 2, 3],
      setB: [1, 2, 3, 4, 5],
      relationType: 'SUBSET' as RelationType,
      difficulty: 1,
    },
    {
      title: '같은 집합',
      description: '두 집합이 완전히 동일한지 확인하세요.',
      setA: [1, 2, 3],
      setB: [1, 2, 3],
      relationType: 'EQUAL' as RelationType,
      difficulty: 1,
    },
    {
      title: '서로소 집합',
      description: '두 집합에 공통 원소가 있는지 확인하세요.',
      setA: [1, 3, 5],
      setB: [2, 4, 6],
      relationType: 'DISJOINT' as RelationType,
      difficulty: 2,
    },
    {
      title: '교집합이 있는 경우',
      description: '두 집합의 관계를 파악하세요.',
      setA: [2, 4, 6],
      setB: [4, 5, 6, 7],
      relationType: 'INTERSECT' as RelationType,
      difficulty: 2,
    },
    {
      title: '초집합 관계',
      description: 'B의 모든 원소가 A에 포함되어 있는지 확인하세요.',
      setA: [1, 2, 3, 4, 5, 6],
      setB: [2, 4, 6],
      relationType: 'SUPERSET' as RelationType,
      difficulty: 2,
    },
    {
      title: '복잡한 부분집합',
      description: '큰 집합에서의 부분집합 관계를 확인하세요.',
      setA: [2, 4, 6, 8],
      setB: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      relationType: 'SUBSET' as RelationType,
      difficulty: 3,
    },
    {
      title: '음수 포함 집합',
      description: '음수를 포함한 집합의 관계를 파악하세요.',
      setA: [-2, -1, 0, 1, 2],
      setB: [-2, -1, 0],
      relationType: 'SUPERSET' as RelationType,
      difficulty: 3,
    },
    {
      title: '홀수와 짝수',
      description: '홀수 집합과 짝수 집합의 관계는?',
      setA: [1, 3, 5, 7, 9],
      setB: [2, 4, 6, 8, 10],
      relationType: 'DISJOINT' as RelationType,
      difficulty: 1,
    },
    {
      title: '소수 집합',
      description: '소수 집합과 자연수 집합의 관계를 파악하세요.',
      setA: [2, 3, 5, 7],
      setB: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      relationType: 'SUBSET' as RelationType,
      difficulty: 2,
    },
    {
      title: '중복 없는 교집합',
      description: '두 집합이 일부 원소를 공유합니다.',
      setA: [5, 10, 15, 20],
      setB: [10, 20, 30, 40],
      relationType: 'INTERSECT' as RelationType,
      difficulty: 2,
    },
  ];

  for (const problem of problems) {
    await prisma.problem.create({
      data: problem,
    });
  }

  console.log(`✅ Created ${problems.length} problems`);

  // Create initial progress for student
  await prisma.progress.create({
    data: {
      userId: student.id,
      totalProblems: 0,
      correctAnswers: 0,
      averageConfidence: 0,
      totalTimeSpent: 0,
    },
  });

  console.log('✅ Created initial progress for student');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
