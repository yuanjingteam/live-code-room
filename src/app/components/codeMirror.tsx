// 'use client';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';
import { useEffect, useState } from 'react';

// import { listenForEvents } from '@/services/socketService';
import {
  listenForCodeSnippet,
  listenForRoomUpdate,
} from '@/services/socketService';
import { sendCodeSnippet } from '@/services/socketService';
import { socket } from '@/services/socketService';

import { evalCode } from '../../lib/tool';

export default function CodeMirrorComponent(props: object) {
  interface State {
    code: string;
    codeComponent: any;
  }

  interface codeType {
    roomId: string;
    codeSnippet: string;
  }
  // interface RoomData {
  //   roomId: string;
  //   members: string[];
  // }

  const [state, setState] = useState<State>({
    code: '',
    codeComponent: null,
  });

  const [code, setCode] = useState<string>(`import React from "react";

const File = () => {
  return <h1 style={ { background: "red", color: "#fff" } }> This is a test </h1>;
};

export default File;`);
  const [output, setOutput] = useState<string>('');

  const [isRun, setIsRun] = useState<boolean>(props.message);

  // 定义回调函数
  const handleCodeSnippet = (payload: codeType) => {
    setCode(payload.codeSnippet); // 更新代码状态
  };

  useEffect(() => {
    // 使用 require 读取代码
    // const rawCode = require(`!raw-loader!../../../src/lib/file`).default;
    setIsRun(true);
    if (isRun) {
      setCode(code);
      runCode();
    }
  }, [props.message]);

  //监听代码更改
  useEffect(() => {
    sendCodeSnippet({
      roomId: localStorage.getItem('roomId'),
      codeSnippet: code,
    });
  }, [code]);

  //实时获取更新过后的代码
  useEffect(() => {
    listenForCodeSnippet(handleCodeSnippet);
    // 组件卸载时移除事件监听（重要！避免内存泄漏）
    return () => {
      // 需要公共文件暴露 socket 实例或提供移除监听的方法
      // 假设公共文件导出 socket，可以这样做：
      socket.off('update-codeSnippet');
    };
  }, []);

  const runCode = (): void => {
    try {
      setState({ code, codeComponent: evalCode(code) });
    } catch (error: any) {
      setOutput(error.message);
    }
  };

  return (
    <div>
      <CodeMirror
        value={code}
        onChange={(value: string) => setCode(value)}
        extensions={[javascript({ jsx: true })]}
        lineNumbers={true}
        gutters={['CodeMirror-linenumbers', 'CodeMirror-foldgutter']}
        theme='dark'
        height='680px'
      />
      <div style={{ width: '50%', background: '#fff' }}>
        {state.codeComponent
          ? React.createElement(state.codeComponent)
          : output}
      </div>
    </div>
  );
}
