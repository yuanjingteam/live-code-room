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
      const result = evalCode(code);
      console.log(result, '运行结果');
      setState({
        code,
        codeComponent: typeof result === 'function' ? result : null
      });
      setOutput(typeof result === 'function' ? '' : String(result));
    } catch (error: any) {
      setOutput(error.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={(value: string) => setCode(value)}
          extensions={[javascript({ jsx: true })]}
          theme='dark'
          height='700px'
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
        />
      </div>
      <div className="mt-4 p-4 bg-gray-800 text-white rounded-lg flex-shrink-0">
        <h3 className="text-lg font-semibold mb-2">运行结果：</h3>
        <div className="whitespace-pre-wrap max-h-[150px] overflow-y-auto">
          {output || (state.codeComponent ? 'Function executed successfully' : '')}
        </div>
      </div>
    </div>
  );
}
