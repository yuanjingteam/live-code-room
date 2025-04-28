// 'use client';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';
import { useEffect, useState } from 'react';

import { listenForCodeSnippet } from '@/services/socketService';
import { sendCodeSnippet } from '@/services/socketService';
import { socket } from '@/services/socketService';

import { evalCode } from '../../lib/tool';

interface CodeMirrorProps {
  message: boolean;
}

export default function CodeMirrorComponent(props: CodeMirrorProps) {
  interface State {
    code: string;
    codeComponent: React.ReactNode | null;
  }

  interface codeType {
    roomId: string;
    codeSnippet: string;
  }

  const [state, setState] = useState<State>({
    code: '',
    codeComponent: null,
  });

  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');

  const [isRun, setIsRun] = useState<boolean>(props.message);

  // 定义回调函数
  const handleCodeSnippet = (payload: codeType) => {
    console.log(payload, code, '接收到的代码块内容');
    sessionStorage.setItem('code', payload.codeSnippet);
    setCode(sessionStorage.getItem('code') as string);

  };

  useEffect(() => {
    setIsRun(true);
    if (isRun) {
      setCode(code);
      runCode();
    }
  }, [props.message]);

  //监听代码更改
  useEffect(() => {
    sendCodeSnippet({
      roomId: sessionStorage.getItem('roomId'),
      codeSnippet: code,
    });
  }, [code]);

  //实时获取更新过后的代码
  useEffect(() => {
    listenForCodeSnippet(handleCodeSnippet);
    setCode(sessionStorage.getItem('code') || '');
    return () => {
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
      {/* <div style={{ width: '50%', background: '#fff' }}>
        {state.codeComponent
          ? React.createElement(state.codeComponent)
          : output}
      </div> */}
    </div>
  );
}
