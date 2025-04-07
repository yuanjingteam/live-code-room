import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  withCredentials: true,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  autoConnect: true, // 自动连接
  reconnection: true, // 启用重连
  reconnectionAttempts: 5, // 重连尝试次数
  reconnectionDelay: 1000, // 重连延迟时间
});

//发送代码片段
export const sendCodeSnippet = (payload) => {
  socket.emit('code-snippet', payload);
};

//发送聊天信息
export const sendChatMessage = (payload) => {
  socket.emit('chat', payload);
};

//让客户端加入指定的房间
export const joinRoom = (room) => {
  socket.emit('join_room', room, (ack) => {
    console.log('加入房间结果:', ack); // 服务器应返回确认
  });
};

//监听服务器发送的事件
export const listenForEvents = (callbacks) => {
  socket.on('code-snippet', callbacks.onCodeSnippet);
  socket.on('chat', callbacks.onChatMessage);
  socket.on('room_update', callbacks.onRoomUpdate);
};
