import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { BsChatSquareText } from 'react-icons/bs';
import { IoSendSharp } from 'react-icons/io5';

import { sendChatMessage } from '@/services/socketService';
import { listenForChat } from '@/services/socketService';
import { socket } from '@/services/socketService';

export default function ChatCom(props: object) {
  interface chatMessage {
    userName: string;
    message: string;
    roomId: string;
  }

  //定义一个状态变量，用于存储输入框的内容
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [chatMessages, setChatMessages] = useState<chatMessage[]>([]);
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    setUserName(sessionStorage.getItem('name') || '');
    setRoomId(sessionStorage.getItem('roomId') || '');
  })

  //判断是否清空聊天记录
  useEffect(() => {
    setChatMessages(JSON.parse(sessionStorage.getItem('chatMessages') || '[]'));
    if (props.isClear) {
      setChatMessages([]);
    }
  }, [props.isClear])

  //获取到输入框的内容
  const updateMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setMessage(e.target.value);
  };

  const sendMessage = () => {
    sendChatMessage({
      userName: userName,
      roomId: roomId,
      message: message,
    });
    setMessage('');
  };

  //更新聊天框的内容
  const handleChatUpdate = (payload: chatMessage) => {
    console.log(payload, 'payload');
    setChatMessages((prevMessages) => {
      const newMessages = [...prevMessages, payload];
      sessionStorage.setItem('chatMessages', JSON.stringify(newMessages));
      return newMessages;
    });

  };

  useEffect(() => {
    listenForChat(handleChatUpdate);
    return () => {
      socket.off('update-chat');
    };
  }, []);

  const scrollChatBottom = () => {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollChatBottom();
  }, [chatMessages]);

  return (
    <div className='h-full flex flex-col bg-white rounded-lg overflow-hidden'>
      {/* 聊天框标题 */}
      <div className='p-4 border-b flex items-center gap-2'>
        <BsChatSquareText className="w-5 h-5 text-emerald-600" />
        <h4 className='text-lg font-medium text-emerald-700'>在这里开启你们的聊天吧~</h4>
      </div>

      {/* 聊天消息区域 */}
      <div
        className="flex-1 p-4 overflow-y-auto w-96 h-2/3 bg-slate-300  overflow-y-auto bg-[url('/images/code-img.jpg')] bg-cover bg-center bg-no-repeat
w-full bg-white rounded-lg shadow-md h-[750px] [&_*]:scrollbar-thin [&_*]:scrollbar-thumb-emerald-500 [&_*]:scrollbar-track-emerald-50 [&_*]:scrollbar-thumb-rounded-full"
        id='chat-box'
      >
        {chatMessages.map((chat, index) => {
          const isMe = chat.userName === userName;
          return (
            <div
              key={index}
              className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-3 shadow-sm
                ${isMe
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-emerald-100 text-gray-800'
                  }`}
              >
                <div className='text-xs mb-1 opacity-80'>
                  {isMe ? 'Me' : chat.userName}
                </div>
                {chat.message.startsWith('icon-') ? (
                  <div className="text-lg">😊</div>
                ) : (
                  <div className="break-words">{chat.message}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 输入框区域 */}
      <div className='p-4 border-t bg-white'>
        <div className='flex gap-2 items-center'>
          <input
            type='text'
            placeholder='输入消息...'
            className='flex-1 px-4 py-2 rounded-full border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all'
            value={message}
            onChange={updateMessage}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className='p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors'
          >
            <IoSendSharp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
