'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { setAnotherName } from '@/store/modules/userInfoStore';

import ChatCom from '@/app/components/chat';
import CodeMirrorComponent from '@/app/components/codeMirror';
import { listenForRoomUpdate, socket } from '@/services/socketService';
import { leaveRoom } from '@/services/socketService';

export default function RoomPage() {
  interface RoomData {
    roomId: string;
    members: string[];
  }

  const router = useRouter();
  const dispatch = useDispatch();

  const [isRun, setIsRun] = useState(false);
  //获取邀请链接
  const [roomId, setRoomId] = useState('');

  //获取当前登录用户的信息
  const [self, setSelf] = useState('');
  const [anotherPlayer, setAnotherPlayer] = useState('');

  const handleRoomUpdate = (data: RoomData) => {
    console.log(data, '999');
    // debugger;
    sessionStorage.setItem(
      'anotherName',
      data.members.filter(
        (member) => member !== sessionStorage.getItem('name'),
      )[0] || '',
    );
    console.log(anotherPlayer, 'ppp');
    setAnotherPlayer(sessionStorage.getItem('anotherName') || '');
    dispatch(setAnotherName());
  };

  useEffect(() => {
    // console.log(socket, '重连 ');
    socket.on('connect', () => {
      console.log('尝试重连');
      socket.emit('join_room', { roomId: sessionStorage.getItem('roomId') || '', userName: sessionStorage.getItem('name') || '' });
    })
  }, [socket])

  useEffect(() => {
    setRoomId(sessionStorage.getItem('roomId') || '');
    setSelf(sessionStorage.getItem('name') || '');
    listenForRoomUpdate(handleRoomUpdate);
    setAnotherPlayer(sessionStorage.getItem('anotherName') || '');
    return () => {
      socket.off('room_update');
    };
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

  //退出房间
  const exitRoom = () => {
    // socket.disconnect();
    leaveRoom({
      roomId: sessionStorage.getItem('roomId') || '',
      userName: sessionStorage.getItem('name') || '',
    });
    sessionStorage.clear();
    localStorage.clear();
    router.push('/');
    return () => {
      socket.off('leave_room');
    };
  };

  return (
    <main>
      <div>
        <div className='flex border-2 w-3/4 h-[100px] mx-auto mt-2 items-center'>
          {/* <p className='w-[300px] text-center'>Live Code Room</p> */}
          <button className='w-[100px] text-center' onClick={exitRoom}>
            退出房间
          </button>
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
                在线成员：<span>🟢{self}</span>{' '}
                {anotherPlayer ? <span>🟢{anotherPlayer}</span> : null}
              </div>
              <button
                onClick={run}
                className='border-2 m-5 rounded-lg h-[40px] col-start-4 col-span-1 '
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
