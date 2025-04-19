import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

import { sendChatMessage } from '@/services/socketService';
import { listenForChat } from '@/services/socketService';
import { socket } from '@/services/socketService';

export default function ChatCom() {
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

  //获取到输入框的内容
  const updateMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    //将输入框的内容赋值给状态变量
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
    sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    setChatMessages((prevMessages: chatMessage[]) => [...prevMessages, payload]);
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
    sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  return (
    <div className='w-full h-full flex flex-col items-center'>
      <h4 className='text-center mt-3'>聊天框</h4>
      <div
        className='w-96 h-2/3 bg-slate-300 m-3 p-4 overflow-y-auto'
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
                className={`max-w-[70%] rounded-lg p-2 ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-black'
                  }`}
              >
                <div className='text-sm mb-1'>
                  {isMe ? 'Me' : chat.userName}
                </div>
                {chat.message.startsWith('icon-') ? (
                  <div>表情</div>
                ) : (
                  <div>{chat.message}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <input
          type='text'
          placeholder='在这里输入发送消息...'
          className='w-80 mr-3'
          value={message}
          onChange={updateMessage}
        />
        <button onClick={sendMessage}>发送</button>
      </div>
    </div>
  );
}
