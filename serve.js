import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: '*',
  },
});

const rooms = new Map();

io.on('connection', (socket) => {
  let currentRoomId = null;

  socket.on('code-snippet', (paylaod) => {
    io.sockets.in(paylaod.roomId).emit('code-snippet', paylaod);
  });

  socket.on('chat', (paylaod) => {
    io.sockets.in(paylaod.roomId).emit('chat', paylaod);
  });

  socket.on('join_room', (room, callback) => {
    try {
      // 1. 离开旧房间
      if (currentRoomId) {
        socket.leave(room.roomId); // 调用离开函数
      }

      // 2. 加入新房间
      currentRoomId = room.roomId;
      socket.userName = room.userName; // 在 socket 对象上存储用户名

      // 初始化房间（如果不存在）
      if (!rooms.has(room.roomId)) {
        rooms.set(room.roomId, new Set());
      }
      rooms.get(room.roomId).add(room.userName);

      // 加入 Socket.IO 房间
      socket.join(room.roomId);

      // 3. 返回完整房间数据
      const roomData = {
        roomId: room.roomId,
        members: Array.from(rooms.get(room.roomId)),
      };

      // 广播给房间内所有人（包括自己）
      io.in(room.roomId).emit('room_update', roomData);

      // 调用客户端回调
      callback({ success: true, roomData });
    } catch (err) {
      callback({ success: false, error: err.message });
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

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
// });
