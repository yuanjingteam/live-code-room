import React from 'react';

export default function ChatCom() {
  //定义一个状态变量，用于存储输入框的内容
  const [message, setMessage] = React.useState('');

  //获取到输入框的内容
  const updateMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    //将输入框的内容赋值给状态变量
    setMessage(e.target.value);
  };

  const sendMessage = () => {
    message;
    // console.log(message,'发送聊天信息');
  };

  return (
    <div className='w-full h-full flex flex-col items-center'>
      <h4 className='text-center mt-3'>聊天框</h4>
      <div className='w-96 h-2/3 bg-slate-300 m-3'></div>
      <div>
        <input
          type='text'
          placeholder='在这里输入发送消息...'
          className='w-80 mr-3'
          onChange={updateMessage}
        />
        <button onClick={sendMessage}>发送</button>
      </div>
    </div>
  );
}
