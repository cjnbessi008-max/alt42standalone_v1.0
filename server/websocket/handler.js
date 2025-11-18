/**
 * WebSocket Handler for Real-time Updates
 * Slow Climb 애니메이션을 위한 실시간 로그 전송
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// 연결된 클라이언트 관리
const clients = new Map();
const rooms = new Map(); // 룸 기반 브로드캐스팅

/**
 * WebSocket 서버 설정
 */
function setupWebSocket(server) {
  const wss = new WebSocket.Server({
    server,
    path: '/ws'
  });

  console.log('✅ WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    const clientInfo = {
      id: clientId,
      ws: ws,
      userId: null,
      rooms: new Set(),
      authenticated: false,
      connectedAt: new Date()
    };

    clients.set(clientId, clientInfo);
    console.log(`📱 Client connected: ${clientId} (Total: ${clients.size})`);

    // 연결 확인 메시지
    sendToClient(ws, {
      type: 'connected',
      clientId: clientId,
      message: 'WebSocket connected successfully',
      timestamp: new Date().toISOString()
    });

    // 메시지 수신 처리
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(clientId, data, ws);
      } catch (error) {
        console.error('Invalid message format:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    // Pong 응답 (연결 유지)
    ws.on('pong', () => {
      clientInfo.lastPong = Date.now();
    });

    // 연결 종료
    ws.on('close', () => {
      handleDisconnect(clientId);
    });

    // 에러 처리
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });

  // Heartbeat (30초마다 ping)
  const heartbeat = setInterval(() => {
    clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      } else {
        handleDisconnect(clientId);
      }
    });
  }, 30000);

  // 서버 종료 시 정리
  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

/**
 * 메시지 처리
 */
function handleMessage(clientId, data, ws) {
  const { type, payload } = data;

  switch (type) {
    case 'auth':
      handleAuth(clientId, payload, ws);
      break;

    case 'join_room':
      handleJoinRoom(clientId, payload);
      break;

    case 'leave_room':
      handleLeaveRoom(clientId, payload);
      break;

    case 'activity_log':
      handleActivityLog(clientId, payload);
      break;

    case 'ping':
      sendToClient(ws, { type: 'pong', timestamp: Date.now() });
      break;

    default:
      sendError(ws, `Unknown message type: ${type}`);
  }
}

/**
 * 인증 처리
 */
function handleAuth(clientId, payload, ws) {
  const { token } = payload;

  if (!token) {
    sendError(ws, 'Authentication token required');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = clients.get(clientId);

    if (client) {
      client.userId = decoded.userId;
      client.authenticated = true;

      sendToClient(ws, {
        type: 'authenticated',
        userId: decoded.userId,
        message: 'Authentication successful'
      });

      console.log(`✅ Client ${clientId} authenticated as user ${decoded.userId}`);
    }
  } catch (error) {
    sendError(ws, 'Invalid authentication token');
  }
}

/**
 * 룸 참여
 */
function handleJoinRoom(clientId, payload) {
  const { roomId } = payload;
  const client = clients.get(clientId);

  if (!client) return;

  // 룸에 클라이언트 추가
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(clientId);
  client.rooms.add(roomId);

  sendToClient(client.ws, {
    type: 'room_joined',
    roomId: roomId,
    message: `Joined room: ${roomId}`
  });

  console.log(`Client ${clientId} joined room: ${roomId}`);
}

/**
 * 룸 퇴장
 */
function handleLeaveRoom(clientId, payload) {
  const { roomId } = payload;
  const client = clients.get(clientId);

  if (!client) return;

  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(clientId);
    client.rooms.delete(roomId);

    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
    }
  }

  sendToClient(client.ws, {
    type: 'room_left',
    roomId: roomId,
    message: `Left room: ${roomId}`
  });

  console.log(`Client ${clientId} left room: ${roomId}`);
}

/**
 * 활동 로그 처리 및 브로드캐스트
 */
function handleActivityLog(clientId, payload) {
  const client = clients.get(clientId);

  if (!client || !client.authenticated) {
    sendError(client.ws, 'Unauthorized');
    return;
  }

  // 같은 룸의 모든 클라이언트에게 브로드캐스트
  client.rooms.forEach(roomId => {
    broadcastToRoom(roomId, {
      type: 'new_activity_log',
      payload: payload,
      timestamp: new Date().toISOString()
    }, clientId); // 발신자 제외
  });
}

/**
 * 연결 종료 처리
 */
function handleDisconnect(clientId) {
  const client = clients.get(clientId);

  if (client) {
    // 모든 룸에서 제거
    client.rooms.forEach(roomId => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(clientId);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        }
      }
    });

    clients.delete(clientId);
    console.log(`📴 Client disconnected: ${clientId} (Total: ${clients.size})`);
  }
}

/**
 * 특정 클라이언트에게 메시지 전송
 */
function sendToClient(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * 에러 메시지 전송
 */
function sendError(ws, message) {
  sendToClient(ws, {
    type: 'error',
    message: message,
    timestamp: new Date().toISOString()
  });
}

/**
 * 룸의 모든 클라이언트에게 브로드캐스트
 */
function broadcastToRoom(roomId, data, excludeClientId = null) {
  const roomClients = rooms.get(roomId);

  if (!roomClients) return;

  let sentCount = 0;

  roomClients.forEach(clientId => {
    if (clientId !== excludeClientId) {
      const client = clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        sendToClient(client.ws, data);
        sentCount++;
      }
    }
  });

  console.log(`📡 Broadcasted to room ${roomId}: ${sentCount} clients`);
}

/**
 * 모든 클라이언트에게 브로드캐스트
 */
function broadcastToAll(data, excludeClientId = null) {
  let sentCount = 0;

  clients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      sendToClient(client.ws, data);
      sentCount++;
    }
  });

  console.log(`📡 Broadcasted to all: ${sentCount} clients`);
}

/**
 * 클라이언트 ID 생성
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 통계 정보 조회
 */
function getStats() {
  return {
    totalClients: clients.size,
    totalRooms: rooms.size,
    roomDetails: Array.from(rooms.entries()).map(([roomId, clientIds]) => ({
      roomId,
      clientCount: clientIds.size
    }))
  };
}

// Export
module.exports = setupWebSocket;

// 외부에서 브로드캐스트할 수 있도록 export
module.exports.broadcastToRoom = broadcastToRoom;
module.exports.broadcastToAll = broadcastToAll;
module.exports.getStats = getStats;
