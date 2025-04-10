import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
  withCredentials: true,
  path: '/socket.io',
  transports: ['websocket'],
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
// 导出一个名为joinRoom的函数，参数为room
export const joinRoom = (room) => {
  // 使用socket.emit方法发送一个名为'join_room'的事件，参数为room
  socket.emit('join_room', room);
};

//监听服务器发送的事件
// export const listenForEvents = (callbacks) => {
//   console.log('listenForEvents', callbacks);
//   socket.on('update-codeSnippet', callbacks.onCodeSnippet);
//   socket.on('chat', callbacks.onChatMessage);
//   if (typeof callbacks.onRoomUpdate === 'function') {
//     socket.on('room_update', callbacks.onRoomUpdate);
//   } else {
//     console.error('callbacks.onRoomUpdate is not a function');
//   }
// };

// 监听代码片段更新事件
export const listenForCodeSnippet = (callback) => {
  if (typeof callback === 'function') {
    socket.on('update-codeSnippet', callback);
  } else {
    console.error('callback for update-codeSnippet is not a function');
  }
};

// 监听聊天消息事件
export const listenForChat = (callback) => {
  console.log('2222');
  if (typeof callback === 'function') {
    socket.on('update-chat', callback);
  } else {
    console.error('callback for chat is not a function');
  }
};

// 监听房间更新事件
export const listenForRoomUpdate = (callback) => {
  if (typeof callback === 'function') {
    socket.on('room_update', callback);
  } else {
    console.error('callback for room_update is not a function');
  }
};
