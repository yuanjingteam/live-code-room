import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { createSocketIO } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);

const io = createSocketIO(server, {
  path: '/socket.io',
  cors: {
    origin: '*',
  },
});

const rooms = new Map();

io.on('connection', (socket) => {
  let currentRoomId = null;

  socket.on('code-snippet', (payload) => {
    io.sockets.in(payload.roomId).emit('update-codeSnippet', payload);
  });

  socket.on('chat', (payload) => {
    io.sockets.in(payload.roomId).emit('chat', payload);
  });

  socket.on('join_room', (payload) => {
    try {
      // 1. 离开旧房间
      if (currentRoomId) {
        socket.leave(payload.roomId); // 调用离开函数
      }

      // 2. 加入新房间
      currentRoomId = payload.roomId;
      socket.userName = payload.userName; // 在 socket 对象上存储用户名

      // 初始化房间（如果不存在）
      if (!rooms.has(payload.roomId)) {
        rooms.set(payload.roomId, new Set());
      }
      rooms.get(payload.roomId).add(payload.userName);

      // 加入 Socket.IO 房间
      socket.join(payload.roomId);

      // 3. 返回完整房间数据
      const roomData = {
        roomId: payload.roomId,
        members: Array.from(rooms.get(payload.roomId)),
      };

      // 广播给房间内所有人（包括自己）
      // io.sockets.in(payload.roomId).emit("room_update", roomData);
      io.to(payload.roomId).emit('room_update', roomData);

      // 调用客户端回调
      // callback({ success: true, roomData });
    } catch (err) {
      console.log(err, 'err');

      // callback({ success: false, error: err.message });
    }
  });
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

if (process.env.NODE_ENV !== 'development') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('Server is running on port 3001');
});
