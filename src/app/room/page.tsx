'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useEffect, useState } from 'react';
import { BsPeople } from 'react-icons/bs';
import { FiCopy, FiLogOut } from 'react-icons/fi';
import { FiPlay } from 'react-icons/fi';
import { RiTeamLine } from 'react-icons/ri';  // 添加在文件顶部
import { useDispatch } from 'react-redux';

import { setAnotherName } from '@/store/modules/userInfoStore';

import ChatCom from '@/app/components/chat';
import CodeMirrorComponent from '@/app/components/codeMirror';
import { joinRoom, listenForRoomUpdate, socket } from '@/services/socketService';
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

  //聊天记录是否清空
  const [isClear, setIsClear] = useState(false);

  const handleRoomUpdate = (data: RoomData) => {
    sessionStorage.setItem(
      'anotherName',
      data.members.filter(
        (member) => member !== sessionStorage.getItem('name'),
      )[0] || '',
    );
    if (data.members.length === 1) {
      sessionStorage.removeItem('chatMessages');
      setIsClear(true);
    }
    setAnotherPlayer(sessionStorage.getItem('anotherName') || '');
    dispatch(setAnotherName());
  };

  useEffect(() => {
    joinRoom({ roomId: sessionStorage.getItem('roomId') || '', userName: sessionStorage.getItem('name') || '' });
  }, [])

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
    const link = `和我一起加入结对编程，我在这里等你哦！访问：http://localhost:3000?roomId=${roomId} 房间号：${roomId}`;
    // 使用现代 Clipboard API
    navigator.clipboard.writeText(link).then(() => {
      alert('邀请链接已复制到剪贴板！\n房间号: ' + roomId);
    });
  };

  //退出房间
  const exitRoom = () => {
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
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 backdrop-blur-sm bg-opacity-90">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧退出按钮 */}
            <button
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 group"
              onClick={exitRoom}
            >
              <FiLogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              <span>退出房间</span>
            </button>

            {/* 中间欢迎信息 */}
            <div className="flex items-center gap-3 bg-emerald-50 px-6 py-3 rounded-full">
              <RiTeamLine className="w-6 h-6 text-emerald-600" />
              <p className="text-lg text-emerald-700 font-medium">
                欢迎回来，<span className="text-emerald-500">{self}</span>
              </p>
            </div>

            {/* 右侧房间信息 */}
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 px-4 py-2 rounded-lg">
                <p className="text-emerald-700">
                  房间号：<span className="font-mono font-medium">{roomId}</span>
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors duration-300"
                onClick={generateAndCopy}
              >
                <FiCopy className="w-5 h-5" />
                <span>复制邀请链接</span>
              </button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 flex gap-6">
          {/* 左侧代码区域 */}
          <div className="flex-1">
            {/* 成员信息和运行按钮 */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BsPeople className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">在线成员</span>
                  <div className="flex gap-3 ml-2">
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-emerald-700">{self}</span>
                    </div>
                    {anotherPlayer && (
                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-emerald-700">{anotherPlayer}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={run}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg"
                >
                  <FiPlay className="w-4 h-4" />
                  <span>运行代码</span>
                </button>
              </div>
            </div>

            {/* 代码编辑器 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <CodeMirrorComponent message={isRun} />
            </div>
          </div>

          {/* 右侧聊天区域 */}
          <div className="w-96">
            <div className="bg-white rounded-lg shadow-md h-[750px]">
              <ChatCom isClear={isClear} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
