'use client';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import '@/lib/env';

import {
  setAnotherName,
  setName,
  setRoomId,
} from '@/store/modules/userInfoStore';

import { listenForRoomUpdate, socket, createRoom, joinRoom } from '@/services/socketService';
import CreateImg from '~/svg/CreateImg.svg';
import JoinImg from '~/svg/JoinImg.svg';
import MessageBox from '@/components/messageBox';

/**
 * SVGR Support
 * Caveat: No React Props Type.
 *
 * You can override the next-env if the type is important to you
 * @see https://stackoverflow.com/questions/68103844/how-to-override-next-js-svg-module-declaration
 */
// !STARTERCONF -> Select !STARTERCONF and CMD + SHIFT + F
// Before you begin editing, follow all comments with `STARTERCONF`,
// to customize the default configuration.

type Props = {
  searchParams: {
    roomId?: string;
  };
};

export default function HomePage({ searchParams }: Props) {
  const roomIdPar = searchParams.roomId;

  const router = useRouter();
  const dispatch = useDispatch();

  // 定义接口来描述输入框的值
  interface RoomFormValues {
    name: string;
    roomId: string;
    nameCreate: string;
  }

  interface RoomData {
    message: string,
    roomId: string;
    members: string[];
  }

  const [formValues, setFormValues] = useState<RoomFormValues>({
    name: '',
    roomId: '',
    nameCreate: '',
  });

  //定义消息提示框中的信息
  const [msg, setMsg] = useState<string | null>(null);

  //控制加入房间的跳转逻辑
  const isJoinJump = useRef(false);

  //控制loading状态
  const [loading, setLoading] = useState(false);

  const handleRoomUpdate = (data: RoomData) => {// 开始 loading
    if (data.message === '已更新') {
      if (isJoinJump.current) {
        router.push(`/room?roomId=${roomIdPar || formValues.roomId}`);
        setLoading(false);
      }
      if (data && data.members && data.members.length > 0) {
        const otherMember = data.members.filter(
          (member) => member !== sessionStorage.getItem('name'),
        );
        if (otherMember && sessionStorage.getItem('name')) {
          sessionStorage.setItem('anotherName', JSON.stringify(otherMember));
          dispatch(setAnotherName());
        }
      }
      if (!sessionStorage.getItem('name')) {
        socket.connect();
      }
    } else {
      setMsg(data.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    listenForRoomUpdate(handleRoomUpdate);
    return () => {
      socket.off('room_update');
    };
  });

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // 处理名字输入框变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (name === 'nameCreate' || name === 'name') {
      sessionStorage.setItem('name', value);
      dispatch(setName());
    } else {
      sessionStorage.setItem('roomId', value);
      dispatch(setRoomId());
    }
  };

  // 处理创建房间的逻辑
  const handleCreateRoom = () => {
    const roomCode = generateRoomCode();
    formValues.roomId = roomCode;
    sessionStorage.setItem('roomId', roomCode);
    dispatch(setRoomId());
    if (formValues.nameCreate === '') {
      setMsg('请填写你的名字');
      return;
    }
    //判断是创建房间，在进入房间后判断是否执行加入房间的操作
    sessionStorage.setItem('isCreator', 'true');
    setLoading(true); // 开始 loading
    createRoom({ roomId: roomCode, userName: formValues.nameCreate });
    router.push(`/room?roomId=${roomCode}`);
  };

  //处理加入房间的逻辑
  const handleJoinRoom = () => {
    if (formValues.name === '') {
      setMsg('请填写你的名字');
      return;
    }
    setLoading(true); // 开始 loading
    joinRoom({ roomId: roomIdPar || formValues.roomId, userName: formValues.name });
    if (roomIdPar) {
      sessionStorage.setItem('roomId', roomIdPar);
    }
    isJoinJump.current = true;
  };

  //生成邀请链接
  // const [inviteLink, setInviteLink] = React.useState('');
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  return (
    <main>
      {/* 消息提示 */}
      {msg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <MessageBox message={msg} type="error" onClose={() => setMsg(null)} />
        </div>
      )}
      {/* 加载loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            {/* 更大更显眼的 loading 动画 */}
            <svg className="animate-spin h-16 w-16 text-emerald-400 drop-shadow-lg" viewBox="0 0 50 50">
              <circle className="opacity-20" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="6" fill="none" />
              <path className="opacity-90" fill="currentColor" d="M25 5a20 20 0 0 1 20 20" />
            </svg>
            {/* 更醒目的提示文字 */}
            <div className="text-2xl font-bold text-white drop-shadow-lg tracking-wide text-center">
              正在进入房间，请稍候...
            </div>
            {/* 可选：再加一个小提示 */}
            <div className="text-base text-emerald-100 mt-2 text-center">
              网络较慢时请耐心等待，不要重复点击
            </div>
          </div>
        </div>
      )}
      <Head>
        <title>Live Code Room</title>
      </Head>
      <section className="bg-white px-2 sm:px-4 py-8 min-h-screen">
        <h1 className="text-center text-5l font-bold mb-6">Live Code Room</h1>
        <div className="flex flex-col md:flex-row gap-8 w-[70vw] max-w-4xl mx-auto">
          <div className="flex-1 border rounded-lg shadow-lg px-6 py-10 bg-white min-w-0 flex flex-col">
            <h1 className="text-center text-4xl font-bold mb-6 tracking-wide">加 入 房 间</h1>
            <JoinImg className="max-w-s mx-auto mb-4" />
            <input
              type="text"
              placeholder="请填写你的名字"
              className="w-full rounded-lg border px-3 py-2 mb-3"
              name="name"
              onChange={handleChange}
            />
            <input
              type="text"
              placeholder="请填写房间号"
              className="w-full rounded-lg border px-3 py-2 mb-5"
              name="roomId"
              onChange={handleChange}
              value={roomIdPar}
            />
            <button
              className="w-full h-10 border rounded-lg bg-lime-500 hover:bg-lime-600 text-white font-semibold transition mt-auto"
              onClick={handleJoinRoom}
            >
              加入房间
            </button>
          </div>
          <div className="flex-1 border rounded-lg shadow-lg px-6 py-10 bg-white min-w-0 flex flex-col">
            <h1 className="text-center text-4xl font-bold mb-6 tracking-wide">创 建 房 间</h1>
            <CreateImg className="max-w-s mx-auto mb-8" />
            <input
              type="text"
              placeholder="请填写你的名字"
              className="w-full rounded-lg border px-3 py-2 mb-8 mt-8"
              name="nameCreate"
              onChange={handleChange}
            />
            <button
              className="w-full h-10 border rounded-lg bg-lime-500 hover:bg-lime-600 text-white font-semibold transition mt-auto"
              onClick={handleCreateRoom}
            >
              创建房间
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
