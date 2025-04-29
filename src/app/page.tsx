'use client';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import '@/lib/env';

import {
  setAnotherName,
  setName,
  setRoomId,
} from '@/store/modules/userInfoStore';

// import { listenForEvents } from '@/services/socketService';
import { listenForRoomUpdate } from '@/services/socketService';
import { socket } from '@/services/socketService';
import { joinRoom } from '@/services/socketService';

import CreateImg from '~/svg/CreateImg.svg';
import JoinImg from '~/svg/JoinImg.svg';

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
    roomId: string;
    members: string[];
  }

  const [formValues, setFormValues] = useState<RoomFormValues>({
    name: '',
    roomId: '',
    nameCreate: '',
  });

  const handleRoomUpdate = (data: RoomData) => {
    if (data && data.members && data.members.length > 0) {
      const otherMember = data.members.filter(
        (member) => member !== sessionStorage.getItem('name'),
      )[0];
      if (otherMember && sessionStorage.getItem('name')) {
        sessionStorage.setItem('anotherName', otherMember);
        dispatch(setAnotherName());
      }
    }
    if (!sessionStorage.getItem('name')) {
      socket.connect();
    }
  };

  useEffect(() => {
    listenForRoomUpdate(handleRoomUpdate);
    return () => {
      socket.off('room_update');
    };
  });

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
      alert('请填写你的名字');
      return;
    }
    joinRoom({ roomId: roomCode, userName: formValues.nameCreate });
    router.push(`/room?roomId=${roomCode}`);
  };

  //处理加入房间的逻辑
  const handleJoinRoom = () => {
    if (formValues.name === '') {
      alert('请填写你的名字');
      return;
    }
    joinRoom({ roomId: roomIdPar || formValues.roomId, userName: formValues.name });
    if (roomIdPar) {
      sessionStorage.setItem('roomId', roomIdPar);
    }
    router.push(`/room?roomId=${roomIdPar || formValues.roomId}`);
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
      <Head>
        <title>Live Code Room</title>
      </Head>
      <section className='bg-white px-8 py-8 h-screen'>
        <h1 className='text-center'>Live Code Room</h1>
        <div className='flex w-[1000px] h-[650px] m-auto mt-8'>
          <div className=' border rounded-lg shadow-lg px-8 py-8 mx-10  w-[450px] h-[650px]'>
            <h1 className='text-center'>加 入 房 间</h1>
            <JoinImg className='max-w-sm'></JoinImg>
            <input
              type='text'
              placeholder='请填写你的名字'
              className='w-full rounded-lg'
              name='name'
              onChange={handleChange}
            />
            <input
              type='text'
              placeholder='请填写房间号'
              className='w-full my-5 rounded-lg'
              name='roomId'
              onChange={handleChange}
              value={roomIdPar}
            />
            <button
              className='w-full h-10 border rounded-lg bg-lime-500 hover:bg-lime-600'
              onClick={handleJoinRoom}
            >
              加入房间
            </button>
          </div>
          <div className='border rounded-lg shadow-lg px-8 py-8 mx-14 w-[450px] h-[650px]'>
            <h1 className='text-center'>创建房间</h1>
            <CreateImg></CreateImg>
            <input
              type='text'
              placeholder='请填写你的名字'
              className='w-full rounded-lg mt-14 my-5'
              name='nameCreate'
              onChange={handleChange}
            />
            <button
              className='w-full h-10 border rounded-lg bg-lime-500 hover:bg-lime-600'
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
