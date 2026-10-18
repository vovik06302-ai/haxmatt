import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { WebSocketServer } from 'ws';

interface OnlineRoom {
  code: string;
  isPublicMatchmaking: boolean;
  status: 'waiting' | 'playing';
  whiteToken: string | null;
  blackToken: string | null;
  whiteJoined: boolean;
  blackJoined: boolean;
  turn: 'w' | 'b';
  locationId: string;
  armyFormationId: string;
  moves: Array<{
    seq: number;
    color: 'w' | 'b';
    from: { r: number; c: number };
    to: { r: number; c: number };
    promotion?: string;
    ts: number;
  }>;
  resetCount: number;
  updatedAt: number;
}

function createOnlineMultiplayerPlugin() {
  const rooms = new Map<string, OnlineRoom>();
  const sseClients = new Map<string, Set< any >>();
  const wsRoomClients = new Map<string, Set< any >>();

  function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 50; attempt++) {
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      if (!rooms.has(code)) return code;
    }
    return 'W' + Math.floor(100 + Math.random() * 899);
  }

  function sanitizeRoom(room: OnlineRoom, justMatched = false) {
    return {
      code: room.code,
      isPublicMatchmaking: room.isPublicMatchmaking,
      status: room.status,
      whiteJoined: room.whiteJoined,
      blackJoined: room.blackJoined,
      players: {
        w: room.whiteJoined,
        b: room.blackJoined
      },
      justMatched,
      turn: room.turn,
      locationId: room.locationId,
      armyFormationId: room.armyFormationId,
      moves: room.moves,
      resetCount: room.resetCount,
      updatedAt: room.updatedAt
    };
  }

  function broadcastPayload(code: string, payloadObj: any) {
    const payload = JSON.stringify(payloadObj);

    const sseSet = sseClients.get(code);
    if (sseSet) {
      for (const res of sseSet) {
        try {
          res.write(`data: ${payload}\n\n`);
        } catch (e) {}
      }
    }

    const wsSet = wsRoomClients.get(code);
    if (wsSet) {
      for (const client of wsSet) {
        try {
          if (client.readyState === 1) {
            client.send(payload);
          }
        } catch (e) {}
      }
    }
  }

  function broadcastRoom(room: OnlineRoom, justMatched = false) {
    const state = sanitizeRoom(room, justMatched);
    broadcastPayload(room.code, {
      type: 'room_state',
      ...state,
      room: state
    });
  }

  function readJsonBody(req: any): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      });
      req.on('error', () => resolve({}));
    });
  }

  function sendJson(res: any, status: number, data: any) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
  }

  return {
    name: 'wizard-chess-online-multiplayer',
    configureServer(server: any) {
      if (server.httpServer) {
        const wss = new WebSocketServer({ noServer: true });

        server.httpServer.on('upgrade', (request: any, socket: any, head: any) => {
          const url = request.url || '';
          if (url.startsWith('/ws-online')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
              wss.emit('connection', ws, request);
            });
          }
        });

        wss.on('connection', (ws: any) => {
          let subscribedCode: string | null = null;

          ws.on('message', (raw: any) => {
            try {
              const msg = JSON.parse(raw.toString());
              if (msg.type === 'subscribe' && msg.code) {
                const code = String(msg.code).toUpperCase();
                if (subscribedCode && wsRoomClients.has(subscribedCode)) {
                  wsRoomClients.get(subscribedCode)?.delete(ws);
                }
                subscribedCode = code;
                if (!wsRoomClients.has(code)) {
                  wsRoomClients.set(code, new Set());
                }
                wsRoomClients.get(code)!.add(ws);
                const existing = rooms.get(code);
                if (existing) {
                  const state = sanitizeRoom(existing, false);
                  ws.send(JSON.stringify({ type: 'room_state', ...state, room: state }));
                }
              } else if (msg.type === 'move' && msg.code) {
                const code = String(msg.code).toUpperCase();
                const room = rooms.get(code);
                const mv = msg.move || msg;
                if (room && mv.from && mv.to) {
                  const seq = room.moves.length + 1;
                  const moveColor = mv.color === 'b' ? 'b' : 'w';
                  const moveRecord = {
                    seq,
                    playerToken: msg.playerToken || mv.playerToken,
                    color: moveColor as 'w' | 'b',
                    from: mv.from,
                    to: mv.to,
                    promotion: mv.promotion || 'archbishop',
                    ts: Date.now()
                  };
                  room.moves.push(moveRecord);
                  room.turn = moveColor === 'w' ? 'b' : 'w';
                  room.updatedAt = Date.now();
                  broadcastPayload(code, {
                    type: 'move',
                    playerToken: msg.playerToken || mv.playerToken,
                    move: moveRecord
                  });
                }
              } else if ((msg.type === 'location_change' || msg.type === 'location') && msg.code && msg.locationId) {
                const code = String(msg.code).toUpperCase();
                const room = rooms.get(code);
                if (room) {
                  room.locationId = String(msg.locationId);
                  room.updatedAt = Date.now();
                  broadcastPayload(code, {
                    type: 'location_change',
                    playerToken: msg.playerToken,
                    locationId: room.locationId
                  });
                }
              } else if (msg.type === 'reset' && msg.code) {
                const code = String(msg.code).toUpperCase();
                const room = rooms.get(code);
                if (room) {
                  room.moves = [];
                  room.turn = 'w';
                  room.resetCount = (room.resetCount || 0) + 1;
                  room.updatedAt = Date.now();
                  broadcastPayload(code, {
                    type: 'reset',
                    playerToken: msg.playerToken
                  });
                }
              }
            } catch (e) {}
          });

          ws.on('close', () => {
            if (subscribedCode && wsRoomClients.has(subscribedCode)) {
              wsRoomClients.get(subscribedCode)?.delete(ws);
            }
          });
        });
      }

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith('/api/rooms') && !rawUrl.startsWith('/api/matchmaking')) {
          return next();
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          return res.end();
        }

        const urlObj = new URL(rawUrl, 'http://localhost:3000');
        const pathname = urlObj.pathname;

        // 1. Create Room: POST /api/rooms/create
        if (req.method === 'POST' && pathname === '/api/rooms/create') {
          const body = await readJsonBody(req);
          const pref = body.preferredColor === 'b' ? 'b' : 'w';
          const token = String(body.playerToken || 'tok_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
          const code = generateRoomCode();
          const room: OnlineRoom = {
            code,
            isPublicMatchmaking: Boolean(body.isPublic),
            status: 'waiting',
            whiteToken: pref === 'w' ? token : null,
            blackToken: pref === 'b' ? token : null,
            whiteJoined: pref === 'w',
            blackJoined: pref === 'b',
            turn: 'w',
            locationId: body.locationId || 'cathedral',
            armyFormationId: body.armyFormationId || 'demons_legends',
            moves: [],
            resetCount: 0,
            updatedAt: Date.now()
          };
          rooms.set(code, room);
          return sendJson(res, 200, {
            ok: true,
            code,
            color: pref,
            playerToken: token,
            locationId: room.locationId,
            room: sanitizeRoom(room)
          });
        }

        // 2. Quick Matchmaking: POST /api/matchmaking/quick OR /api/rooms/matchmake
        if (req.method === 'POST' && (pathname === '/api/matchmaking/quick' || pathname === '/api/rooms/matchmake')) {
          const body = await readJsonBody(req);
          const token = String(body.playerToken || 'tok_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));

          let matchedRoom: OnlineRoom | null = null;
          for (const rm of rooms.values()) {
            if (rm.status === 'waiting' && (!rm.whiteJoined || !rm.blackJoined)) {
              if (rm.whiteToken !== token && rm.blackToken !== token) {
                matchedRoom = rm;
                break;
              }
            }
          }

          if (matchedRoom) {
            let assignedColor: 'w' | 'b' = 'b';
            if (!matchedRoom.whiteJoined) {
              matchedRoom.whiteToken = token;
              matchedRoom.whiteJoined = true;
              assignedColor = 'w';
            } else {
              matchedRoom.blackToken = token;
              matchedRoom.blackJoined = true;
              assignedColor = 'b';
            }
            matchedRoom.status =
              matchedRoom.whiteJoined && matchedRoom.blackJoined ? 'playing' : 'waiting';
            matchedRoom.updatedAt = Date.now();
            broadcastRoom(matchedRoom, true);
            return sendJson(res, 200, {
              ok: true,
              matched: true,
              code: matchedRoom.code,
              color: assignedColor,
              playerToken: token,
              locationId: matchedRoom.locationId,
              room: sanitizeRoom(matchedRoom, true)
            });
          }

          const code = generateRoomCode();
          const newRoom: OnlineRoom = {
            code,
            isPublicMatchmaking: true,
            status: 'waiting',
            whiteToken: token,
            blackToken: null,
            whiteJoined: true,
            blackJoined: false,
            turn: 'w',
            locationId: body.locationId || 'cathedral',
            armyFormationId: body.armyFormationId || 'demons_legends',
            moves: [],
            resetCount: 0,
            updatedAt: Date.now()
          };
          rooms.set(code, newRoom);
          return sendJson(res, 200, {
            ok: true,
            matched: false,
            code,
            color: 'w',
            playerToken: token,
            locationId: newRoom.locationId,
            room: sanitizeRoom(newRoom, false)
          });
        }

        // 3. Join Room by Code: POST /api/rooms/join
        if (req.method === 'POST' && pathname === '/api/rooms/join') {
          const body = await readJsonBody(req);
          const code = String(body.code || '').trim().toUpperCase();
          const token = String(body.playerToken || 'tok_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
          let room = rooms.get(code);

          if (!room) {
            room = {
              code,
              isPublicMatchmaking: false,
              status: 'waiting',
              whiteToken: token,
              blackToken: null,
              whiteJoined: true,
              blackJoined: false,
              turn: 'w',
              locationId: body.locationId || 'cathedral',
              armyFormationId: 'demons_legends',
              moves: [],
              resetCount: 0,
              updatedAt: Date.now()
            };
            rooms.set(code, room);
            return sendJson(res, 200, {
              ok: true,
              code,
              color: 'w',
              playerToken: token,
              moves: room.moves,
              locationId: room.locationId,
              room: sanitizeRoom(room)
            });
          }

          let color: 'w' | 'b' = 'b';
          if (room.whiteToken === token) {
            color = 'w';
            room.whiteJoined = true;
          } else if (room.blackToken === token) {
            color = 'b';
            room.blackJoined = true;
          } else if (!room.whiteJoined) {
            room.whiteToken = token;
            room.whiteJoined = true;
            color = 'w';
          } else {
            room.blackToken = token;
            room.blackJoined = true;
            color = 'b';
          }
          const justMatched = room.whiteJoined && room.blackJoined;
          room.status = justMatched ? 'playing' : 'waiting';
          room.updatedAt = Date.now();
          broadcastRoom(room, justMatched);

          return sendJson(res, 200, {
            ok: true,
            code,
            color,
            playerToken: token,
            moves: room.moves,
            locationId: room.locationId,
            room: sanitizeRoom(room, justMatched)
          });
        }

        // 4. POST /api/rooms/move
        if (req.method === 'POST' && pathname === '/api/rooms/move') {
          const body = await readJsonBody(req);
          const code = String(body.code || '').trim().toUpperCase();
          const room = rooms.get(code);
          if (!room) return sendJson(res, 404, { ok: false });
          if (body.from && body.to) {
            const moveColor = body.color === 'b' ? 'b' : 'w';
            const seq = room.moves.length + 1;
            const moveRecord = {
              seq,
              playerToken: body.playerToken,
              color: moveColor as 'w' | 'b',
              from: body.from,
              to: body.to,
              promotion: body.promotion || 'archbishop',
              ts: Date.now()
            };
            room.moves.push(moveRecord);
            room.turn = moveColor === 'w' ? 'b' : 'w';
            room.updatedAt = Date.now();
            broadcastPayload(code, {
              type: 'move',
              playerToken: body.playerToken,
              move: moveRecord
            });
          }
          return sendJson(res, 200, { ok: true, room: sanitizeRoom(room) });
        }

        // 5. GET /api/rooms/stream?code=XXXX
        if (req.method === 'GET' && pathname === '/api/rooms/stream') {
          const code = String(urlObj.searchParams.get('code') || '').trim().toUpperCase();
          const room = rooms.get(code);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (!sseClients.has(code)) sseClients.set(code, new Set());
          sseClients.get(code)!.add(res);
          if (room) {
            const state = sanitizeRoom(room);
            res.write(`data: ${JSON.stringify({ type: 'room_state', ...state, room: state })}\n\n`);
          }
          req.on('close', () => {
            sseClients.get(code)?.delete(res);
          });
          return;
        }

        // Match /api/rooms/:code/...
        const match = pathname.match(/^\/api\/rooms\/([A-Z0-9_-]+)\/(state|events|move|reset|location)$/i);
        if (match) {
          const code = match[1].toUpperCase();
          const action = match[2].toLowerCase();
          const room = rooms.get(code);

          if (action === 'state' && req.method === 'GET') {
            if (!room) return sendJson(res, 404, { ok: false, error: 'Room not found' });
            const state = sanitizeRoom(room);
            return sendJson(res, 200, { ok: true, ...state, room: state });
          }

          if (action === 'events' && req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (!sseClients.has(code)) sseClients.set(code, new Set());
            sseClients.get(code)!.add(res);
            if (room) {
              const state = sanitizeRoom(room);
              res.write(`data: ${JSON.stringify({ type: 'room_state', ...state, room: state })}\n\n`);
            }
            req.on('close', () => {
              sseClients.get(code)?.delete(res);
            });
            return;
          }
        }

        return next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), createOnlineMultiplayerPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  };
});

