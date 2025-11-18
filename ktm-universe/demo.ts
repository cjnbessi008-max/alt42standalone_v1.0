/**
 * KTM Universe Demo
 *
 * Demonstrates the integration of AI Teacher with the Math Universe
 */

import { orchestrator } from './orchestrator/ai-teacher-orchestrator.js';

async function runDemo() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('     🌌 KTM MATH UNIVERSE × AI TEACHER DEMO 🌌');
  console.log('═'.repeat(70));
  console.log('\n');

  // Initialize the system
  console.log('⚙️  Initializing KTM Universe...\n');
  await orchestrator.initialize();

  // Start a teaching session
  console.log('\n📚 Starting demo teaching session...\n');
  const sessionId = await orchestrator.startSession('demo-learner', [
    'Understand fractions',
    'Learn basic algebra',
    'Explore mathematical history'
  ]);

  // Get recommendations
  console.log('\n🎯 Getting personalized app recommendations...\n');
  const recommendations = await orchestrator.recommendNextApps(sessionId, 5);

  // Show statistics
  console.log('\n📊 System Statistics:');
  console.log('━'.repeat(70));
  const stats = orchestrator.getStatistics();
  console.log(`Total Apps Available: ${stats.totalApps}`);
  console.log(`Active Sessions: ${stats.activeSessions}`);
  console.log(`Total Learners: ${stats.totalLearners}`);
  console.log(`Apps Completed: ${stats.appsCompleted}`);
  console.log('━'.repeat(70));

  // Simulate app completion
  console.log('\n🎮 Simulating app completion...\n');
  await orchestrator.recordCompletion(sessionId, 'history-001', 0.85, 1200);

  // Get new recommendations based on progress
  console.log('\n🔄 Getting updated recommendations after completion...\n');
  await orchestrator.recommendNextApps(sessionId, 3);

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('     ✅ DEMO COMPLETE - KTM UNIVERSE IS ALIVE! ✅');
  console.log('═'.repeat(70));
  console.log('\n');
  console.log('🌟 Key Features Demonstrated:');
  console.log('   ✓ AI Teacher initialization and awakening');
  console.log('   ✓ Personalized app recommendations');
  console.log('   ✓ Adaptive difficulty and emotional awareness');
  console.log('   ✓ Progress tracking across 550+ apps');
  console.log('   ✓ Dynamic re-recommendation based on performance');
  console.log('\n');
  console.log('🚀 Next Steps:');
  console.log('   • Open ktm-universe/hub/index.html in a browser');
  console.log('   • Explore the 6 mathematical planets');
  console.log('   • Launch individual apps to see them in action');
  console.log('   • Watch the AI Teacher guide your journey');
  console.log('\n');
}

// Run demo if executed directly
runDemo().catch(console.error);
