'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useEffect, useState } from 'react';
import { BsPeople } from 'react-icons/bs';
import { FiCopy, FiLogOut, FiPlay } from 'react-icons/fi';
import { RiTeamLine } from 'react-icons/ri';  // 添加在文件顶部
import { useDispatch } from 'react-redux';

import { setAnotherName } from '@/store/modules/userInfoStore';

import ChatCom from '@/app/components/chat';
import CodeMirrorComponent from '@/app/components/codeMirror';
import { joinRoom, listenForRoomUpdate, socket, leaveRoom } from '@/services/socketService';
import MessageBox from '@/components/messageBox';

export default function RoomPage() {
  interface RoomData {
    message: string,
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
  const [anotherPlayer, setAnotherPlayer] = useState<string[]>([]);

  //聊天记录是否清空
  const [isClear, setIsClear] = useState(false);

  //定义消息提示框中的信息
  const [msg, setMsg] = useState<string | null>(null);

  const handleRoomUpdate = (data: RoomData) => {

    if (data.message === '已更新') {
      // 过滤出其他成员
      const otherMembers = data.members.filter(
        (member) => member !== sessionStorage.getItem('name')
      );

      // 将数组转换为 JSON 字符串存储
      sessionStorage.setItem('anotherName', JSON.stringify(otherMembers));

      if (data.members.length === 1) {
        sessionStorage.removeItem('chatMessages');
        setIsClear(true);
      }

      // 更新状态
      setAnotherPlayer(otherMembers);
      dispatch(setAnotherName());
    } else {
      if (data.message !== '该用户名已被占用，请换一个名字') {
        setMsg(data.message);
        router.push('/');
      }
    }
  };

  useEffect(() => {
    //避免严格模式下两次调用该函数
    joinRoom({
      roomId: sessionStorage.getItem('roomId') || '',
      userName: sessionStorage.getItem('name') || ''
    });
  }, []);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  useEffect(() => {
    setRoomId(sessionStorage.getItem('roomId') || '');
    setSelf(sessionStorage.getItem('name') || '');
    listenForRoomUpdate(handleRoomUpdate);

    // 从 sessionStorage 获取并解析数据
    const storedAnotherName = sessionStorage.getItem('anotherName');
    if (storedAnotherName) {
      try {
        const parsedData = JSON.parse(storedAnotherName);
        setAnotherPlayer(parsedData);
      } catch (error) {
        console.error('Error parsing anotherName:', error);
        setAnotherPlayer([]);
      }
    } else {
      setAnotherPlayer([]);
    }

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
      setMsg('邀请链接已复制到剪贴板！\n房间号: ' + roomId);
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
      {msg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MessageBox message={msg} type="success" onClose={() => setMsg(null)} />
        </div>
      )}
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
        <div className="container mx-auto px-4 flex gap-6 h-[calc(100vh-120px)]">
          {/* 左侧代码区域 */}
          <div className="flex-1 flex flex-col">
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
                    {anotherPlayer && anotherPlayer.map((player, index) => {
                      return (
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full" key={index}>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-emerald-700">{player}</span>
                        </div>
                      )
                    })}
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex-1">
              <CodeMirrorComponent message={isRun} />
            </div>
          </div>

          {/* 右侧聊天区域 */}
          <div className="w-96">
            <div className="bg-white rounded-lg shadow-md h-full">
              <ChatCom isClear={isClear} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
