'use client';
import React from 'react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

import ChatCom from '@/app/components/chat';
import CodeMirrorComponent from '@/app/components/codeMirror';

export default function RoomPage() {
  interface RoomData {
    roomId: string;
    members: string[];
  }

  interface responseData {
    success: boolean;
    roomData: RoomData;
  }
  const socket = io('http://localhost:3001', {
    withCredentials: true,
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true, // 自动连接
    reconnection: true, // 启用重连
    reconnectionAttempts: 5, // 重连尝试次数
    reconnectionDelay: 1000, // 重连延迟时间
  });

  const [isRun, setIsRun] = React.useState(false);
  //获取邀请链接
  const [roomId, setRoomId] = React.useState('');

  //获取房间信息
  const [roomData, setRoomData] = React.useState<RoomData>({
    roomId: '',
    members: [],
  });

  //获取当前登录用户的信息
  const self = localStorage.getItem('name') || '';

  useEffect(() => {
    setRoomId(localStorage.getItem('roomId') || '');
    socket.emit(
      'join_room',
      {
        roomId: localStorage.getItem('roomId') || '',
        userName: localStorage.getItem('name'),
      },
      (ack: responseData) => {
        setRoomData(ack.roomData);
      },
    );
    socket.on('room_update', (callback) => {
      setRoomData(callback);
    });
  }, []);

  //运行代码
  const run = () => {
    setIsRun(!isRun);
  };

  //复制邀请链接
  const generateAndCopy = () => {
    const link = `和我一起加入结对编程，我在这里等你哦！访问：http://localhost:3000 房间号：${roomId}`;
    // 使用现代 Clipboard API
    navigator.clipboard.writeText(link).then(() => {
      alert('邀请链接已复制到剪贴板！\n房间号: ' + roomId);
    });
  };

  return (
    <main>
      <div>
        <div className='flex border-2 w-3/4 h-[100px] mx-auto mt-2 items-center'>
          <p className='w-[300px] text-center'>Live Code Room</p>
          <p className='flex-1 text-center'>哈喽啊~{self}</p>
          <div className='w-[300px] text-center'>
            <p>房间号：{roomId}</p>
            <button
              className='w-32 h-8 rounded-lg bg-slate-500'
              onClick={generateAndCopy}
            >
              Copy invite link
            </button>
          </div>
        </div>
        <div className='flex w-3/4 mx-auto'>
          <div className='w-3/4'>
            <div className='grid items-center'>
              <div className='col-start-1 col-span-3 h-[60px] items-center border-2 rounded-lg my-3 flex items-center pl-2'>
                在线成员：{roomData.members[0]} {roomData.members[1]}
              </div>
              <button
                onClick={run}
                className='border-2 m-5 rounded-lg w-[50px] h-[30px] col-start-4 col-span-1 '
              >
                运行
              </button>
              <button
                onClick={run}
                className='border-2 m-5 rounded-lg w-[50px] h-[30px] col-start-5 col-span-1 '
              >
                运行
              </button>
            </div>
            <div>
              <CodeMirrorComponent message={isRun} />
            </div>
          </div>
          <div className='w-1/3 my-3 ml-2 border-2 rounded-2xl h-[750px]'>
            <ChatCom />
          </div>
        </div>
      </div>
    </main>
  );
}
