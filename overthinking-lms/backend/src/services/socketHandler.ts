import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../index';
import { calculateOverthinkingScore, analyzeRepetitiveClicks, calculateInactivity } from './overthinkingDetector';
import { BehaviorEventData } from '../types';

interface StudentSocket extends Socket {
  studentId?: string;
  problemId?: string;
  attemptId?: string;
}

interface TeacherSocket extends Socket {
  teacherId?: string;
}

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Student joins a problem-solving session
    socket.on('student:join', async (data: { studentId: string; problemId: string; attemptId: string }) => {
      const studentSocket = socket as StudentSocket;
      studentSocket.studentId = data.studentId;
      studentSocket.problemId = data.problemId;
      studentSocket.attemptId = data.attemptId;

      // Join student-specific room
      socket.join(`student:${data.studentId}`);
      socket.join(`attempt:${data.attemptId}`);

      console.log(`👨‍🎓 Student ${data.studentId} joined problem ${data.problemId}`);

      // Start monitoring
      startOverthinkingMonitor(studentSocket, io);
    });

    // Teacher joins dashboard
    socket.on('teacher:join', (data: { teacherId: string }) => {
      const teacherSocket = socket as TeacherSocket;
      teacherSocket.teacherId = data.teacherId;
      socket.join(`teacher:${data.teacherId}`);

      console.log(`👨‍🏫 Teacher ${data.teacherId} joined dashboard`);
    });

    // Track behavior event
    socket.on('behavior:track', async (eventData: BehaviorEventData) => {
      try {
        await prisma.behaviorEvent.create({
          data: {
            studentId: eventData.studentId,
            problemId: eventData.problemId,
            attemptId: eventData.attemptId,
            eventType: eventData.eventType,
            eventData: eventData.eventData || {},
            timestamp: new Date(),
          },
        });

        // Update last activity time
        if (eventData.attemptId) {
          const studentSocket = socket as StudentSocket;
          studentSocket.emit('activity:updated', { timestamp: new Date() });
        }
      } catch (error) {
        console.error('Error tracking behavior:', error);
      }
    });

    // Student requests hint
    socket.on('hint:request', async (data: { problemId: string; level: number }) => {
      try {
        const problem = await prisma.problem.findUnique({
          where: { id: data.problemId },
          select: { hints: true },
        });

        if (problem && problem.hints) {
          const hints = problem.hints as any[];
          const hint = hints.find((h) => h.level === data.level);

          if (hint) {
            socket.emit('hint:response', hint);

            // Update attempt with hint usage
            const studentSocket = socket as StudentSocket;
            if (studentSocket.attemptId) {
              await prisma.studentAttempt.update({
                where: { id: studentSocket.attemptId },
                data: { hintLevelUsed: Math.max(data.level, 0) },
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching hint:', error);
        socket.emit('hint:error', { message: 'Failed to fetch hint' });
      }
    });

    // Student dismisses overthinking notification
    socket.on('overthinking:dismiss', async (data: { eventId: string }) => {
      try {
        await prisma.overthinkingEvent.update({
          where: { id: data.eventId },
          data: {
            studentResponse: 'hint_declined',
            resolvedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error dismissing overthinking event:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Monitor student for overthinking patterns
 */
function startOverthinkingMonitor(socket: StudentSocket, io: SocketIOServer) {
  const checkInterval = 30000; // Check every 30 seconds

  const intervalId = setInterval(async () => {
    if (!socket.studentId || !socket.problemId || !socket.attemptId) {
      clearInterval(intervalId);
      return;
    }

    try {
      await checkForOverthinking(socket, io);
    } catch (error) {
      console.error('Error in overthinking monitor:', error);
    }
  }, checkInterval);

  // Clear interval on disconnect
  socket.on('disconnect', () => {
    clearInterval(intervalId);
  });
}

/**
 * Check if student is overthinking
 */
async function checkForOverthinking(socket: StudentSocket, io: SocketIOServer) {
  const { studentId, problemId, attemptId } = socket;

  if (!studentId || !problemId || !attemptId) return;

  // Get current attempt
  const attempt = await prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      problem: true,
      student: {
        include: {
          teachers: {
            include: {
              teacher: true,
            },
          },
        },
      },
    },
  });

  if (!attempt || attempt.submittedAt) return; // Already submitted

  // Calculate time spent
  const timeSpent = Math.floor((new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000);

  // Get recent behavior events
  const recentEvents = await prisma.behaviorEvent.findMany({
    where: {
      attemptId,
      timestamp: {
        gte: new Date(Date.now() - 600000), // Last 10 minutes
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Calculate inactivity
  const lastEvent = recentEvents[0];
  const inactivityDuration = lastEvent
    ? calculateInactivity(new Date(lastEvent.timestamp))
    : timeSpent;

  // Analyze repetitive clicks
  const repetitiveClicks = analyzeRepetitiveClicks(
    recentEvents.map((e) => ({
      eventType: e.eventType,
      eventData: e.eventData as any,
      timestamp: new Date(e.timestamp),
    }))
  );

  // Get consecutive errors
  const consecutiveErrors = await getConsecutiveErrorsCount(studentId, attempt.problem.problemType);

  // Calculate overthinking score
  const score = calculateOverthinkingScore({
    timeSpent,
    avgTime: attempt.problem.avgSolveTimeSeconds,
    answerModifications: attempt.answerModifications,
    inactivityDuration,
    repetitiveClicks,
    consecutiveErrors,
  });

  // Only act if score is significant
  if (score.total >= 40) {
    // Check if we already have an unresolved event
    const existingEvent = await prisma.overthinkingEvent.findFirst({
      where: {
        attemptId,
        resolvedAt: null,
      },
    });

    if (!existingEvent) {
      // Create overthinking event
      const event = await prisma.overthinkingEvent.create({
        data: {
          studentId,
          problemId,
          attemptId,
          score: score.total,
          confidence: score.confidence,
          triggers: score.triggers,
          recommendation: score.recommendation,
          interventionTaken: 'none',
        },
      });

      // Send appropriate intervention
      if (score.recommendation === 'hint') {
        socket.emit('overthinking:hint_suggest', {
          eventId: event.id,
          message: '힌트가 필요하신가요?',
          score: score.total,
        });

        await prisma.overthinkingEvent.update({
          where: { id: event.id },
          data: { interventionTaken: 'hint_shown' },
        });
      } else if (score.recommendation === 'alert_teacher') {
        // Alert student
        socket.emit('overthinking:alert', {
          eventId: event.id,
          message: '이 문제가 어려우신가요? 선생님께 도움을 요청하시겠어요?',
          score: score.total,
        });

        // Alert teachers
        for (const teacherAssignment of attempt.student.teachers) {
          io.to(`teacher:${teacherAssignment.teacherId}`).emit('alert:student_struggling', {
            eventId: event.id,
            studentId: attempt.studentId,
            studentName: attempt.student.name,
            problemId: attempt.problemId,
            problemTitle: attempt.problem.title,
            score: score.total,
            triggers: score.triggers,
            timestamp: new Date(),
          });
        }

        await prisma.overthinkingEvent.update({
          where: { id: event.id },
          data: { interventionTaken: 'teacher_alerted' },
        });
      }
    }
  }
}

async function getConsecutiveErrorsCount(studentId: string, problemType: string): Promise<number> {
  const recentAttempts = await prisma.studentAttempt.findMany({
    where: {
      studentId,
      problem: { problemType },
      isCorrect: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  let count = 0;
  for (const attempt of recentAttempts) {
    if (attempt.isCorrect === false) count++;
    else break;
  }

  return count;
}
