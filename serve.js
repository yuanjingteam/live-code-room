const { log } = require('console');
const dotenv = require('dotenv');
const express = require('express');
const { createServer } = require('http');
const path = require('path');
const { Server } = require('socket.io');

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
const roomTimers = new Map(); // 存储每个房间的定时器 ID

io.on('connection', (socket) => {

  const handleUserLeave = () => {

    const roomId = socketToRoom.get(socket.id);

    if (roomId) {

      // 从房间中移除用户
      if (rooms.has(roomId)) {


        const userName = socket.userName;
        if (userName) {

          rooms.get(roomId).delete(userName);
          // 如果房间还有成员，广播更新
          if (rooms.get(roomId).size > 0) {

            const roomData = {
              message: '已更新',
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
  }

  // 监听断开连接事件
  socket.on('disconnect', (reason) => {

    if (reason === 'transport close') {
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        // 为该房间设置定时器
        const timer = setTimeout(() => {
          handleUserLeave();
        }, 5000);

        // 将定时器 ID 存储到 roomTimers 中
        roomTimers.set(roomId, timer);
      }
    } else {
      handleUserLeave();
    }
  });

  socket.on('code-snippet', (payload) => {
    io.sockets.in(payload.roomId).emit('update-codeSnippet', payload);
  });

  socket.on('chat', (payload) => {
    io.sockets.in(payload.roomId).emit('update-chat', payload);
  });

  socket.on('leave_room', (payload) => {
    try {
      const { roomId, userName } = payload;
      if (!roomId || !userName) {
        socket.emit('room_update', { message: '房间ID或用户名不能为空' });
        return;
      }

      // 检查该房间是否存在
      if (rooms.has(roomId)) {
        const roomSet = rooms.get(roomId);

        // 从房间中移除用户
        roomSet.delete(userName);

        // 清理相关的定时器
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId));
          roomTimers.delete(roomId);
        }

        // 如果房间还有其他用户，广播更新
        if (roomSet.size > 0) {
          io.to(roomId).emit('room_update', {
            message: '已更新',
            roomId,
            members: Array.from(roomSet),
          });
        } else {
          // 如果房间空了，删除房间
          rooms.delete(roomId);
        }

        // 让 socket 离开房间
        socket.leave(roomId);

        // 清理 socket 到房间的映射
        if (socketToRoom.get(socket.id) === roomId) {
          socketToRoom.delete(socket.id);
        }

        // 发送成功响应
        socket.emit('room_update', {
          message: '已更新',
          roomId,
          members: Array.from(roomSet)
        });
      } else {
        socket.emit('room_update', { message: '房间不存在' });
      }
    } catch (err) {
      console.error('Error in leave_room:', err);
      socket.emit('room_update', { message: '离开房间时发生错误' });
    }
  });

  // 创建房间
  socket.on('create_room', (data) => {
    const { roomId, userName } = data;

    // 检查房间是否已存在
    if (rooms.has(roomId)) {
      socket.emit('room_update', { message: '房间已存在' });
      return;
    }

    // 创建新房间
    rooms.set(roomId, new Set([userName]));

    // 加入房间
    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);
    socket.userName = userName;

    // 发送成功响应
    socket.emit('room_update', {
      message: '已更新',
      roomId,
      members: Array.from(rooms.get(roomId))
    });

    console.log(`用户 ${userName} 创建了房间 ${roomId}`);
  });

  // 加入房间
  socket.on('join_room', (data) => {
    const roomId1 = socketToRoom.get(socket.id);
    if (roomId1 && roomTimers.has(roomId1)) {
      // 清除该房间的定时器
      clearTimeout(roomTimers.get(roomId1));
      roomTimers.delete(roomId1); // 从映射中移除定时器
    }

    const { roomId, userName } = data;

    // 检查房间是否存在
    if (!rooms.has(roomId)) {
      socket.emit('room_update', { message: '房间不存在' });
      return;
    }

    const roomSet = rooms.get(roomId);

    //判断用户名是否在这个房间已经存在
    if (roomSet.has(userName)) {
      socket.emit('room_update', { message: '该用户名已被占用，请换一个名字' });
      return;
    }

    // 加入房间
    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);
    socket.userName = userName;
    roomSet.add(userName);

    // 广播更新后的成员列表
    io.to(roomId).emit('room_update', {
      message: '已更新',
      roomId,
      members: Array.from(roomSet)
    });

    console.log(`用户 ${userName} 加入了房间 ${roomId}`);
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
