import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO 初始化（ES模块方式）
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: '*',
  },
});

const rooms = new Map();
const socketToRoom = new Map(); // 用于跟踪 socket 所在的房间

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // 监听断开连接事件
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      // 从房间中移除用户
      if (rooms.has(roomId)) {
        const userName = socket.userName;
        if (userName) {
          rooms.get(roomId).delete(userName);
          console.log('User left room:', {
            roomId,
            userName,
            remainingMembers: Array.from(rooms.get(roomId)),
          });

          // 如果房间还有成员，广播更新
          if (rooms.get(roomId).size > 0) {
            const roomData = {
              roomId,
              members: Array.from(rooms.get(roomId)),
            };
            io.to(roomId).emit('room_update', roomData);
          } else {
            // 如果房间空了，删除房间
            rooms.delete(roomId);
          }
        }
      }
      socketToRoom.delete(socket.id);
    }
  });

  socket.on('code-snippet', (payload) => {
    io.sockets.in(payload.roomId).emit('update-codeSnippet', payload);
  });

  socket.on('chat', (payload) => {
    io.sockets.in(payload.roomId).emit('update-chat', payload);
    console.log(payload);
  });

  socket.on('leave_room', (payload) => {
    try {
      // 从 payload 中获取要离开的房间 ID
      const roomId = payload.roomId;
      if (!roomId) {
        return; // 如果没有提供房间 ID，则不执行任何操作
      }

      // 检查该房间是否存在
      if (rooms.has(roomId)) {
        const userName = socket.userName;
        if (userName) {
          const roomSet = rooms.get(roomId);
          roomSet.delete(userName); // 从房间中移除用户

          if (roomSet.size > 0) {
            // 如果房间中还有其他用户，广播房间更新
            io.to(roomId).emit('room_update', {
              roomId: roomId,
              members: Array.from(roomSet),
            });
          } else {
            // 如果房间中没有其他用户，删除房间
            rooms.delete(roomId);
          }
        }
      }

      // 如果当前 socket 已经加入该房间，则让其离开
      if (socket.rooms.has(roomId)) {
        socket.leave(roomId);
      }

      // 如果当前 socket 的映射房间是这个房间，则清理映射
      if (socketToRoom.get(socket.id) === roomId) {
        socketToRoom.delete(socket.id);
      }
    } catch (err) {
      console.log('Error in leave_room:', err);
    }
  });

  socket.on('join_room', (payload) => {
    try {
      // 2. 检查是否需要加入新房间
      if (payload.roomId) {
        socketToRoom.set(socket.id, payload.roomId);
        socket.userName = payload.userName;

        // 初始化房间
        if (!rooms.has(payload.roomId)) {
          rooms.set(payload.roomId, new Set());
        }
        const newRoomSet = rooms.get(payload.roomId);

        // 清理可能残留的同名用户
        if (newRoomSet.has(payload.userName)) {
          newRoomSet.delete(payload.userName);
        }

        newRoomSet.add(payload.userName);
        socket.join(payload.roomId);

        // 广播更新
        io.to(payload.roomId).emit('room_update', {
          roomId: payload.roomId,
          members: Array.from(newRoomSet),
        });
      }
    } catch (err) {
      console.log('Error in join_room:', err);
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
