// 'use client';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';
import { useEffect, useRef, useState } from 'react';

import { listenForCodeSnippet, sendCodeSnippet, socket } from '@/services/socketService';


interface CodeMirrorProps {
  message: boolean;
}

export default function CodeMirrorComponent(props: CodeMirrorProps) {
  interface codeType {
    roomId: string;
    codeSnippet: string;
  }

  const [code, setCode] = useState<string>('');

  // 定义回调函数
  const handleCodeSnippet = (payload: codeType) => {
    console.log('ddddd');

    sessionStorage.setItem('code', payload.codeSnippet);
    setCode(sessionStorage.getItem('code') as string);
  };

  useEffect(() => {
    setCode(code);
    runCode();
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

  //--------------------------------------执行代码的逻辑--------------------------------------------
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string>('');

  // 简单安全检测函数，拦截显眼的危险API
  const isCodeSafe = (code: string) => {
    const dangerPatterns = [/eval\(/, /Function\(/, /XMLHttpRequest/, /fetch\(/];
    return !dangerPatterns.some((reg) => reg.test(code));
  };

  const runCode = () => {
    if (!isCodeSafe(code)) {
      setError("代码包含不安全内容，禁止执行");
      return;
    }

    setError("");

    // 把用户代码注入iframe模板
    const srcdoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <style>
          body {
            margin:0;
            font-family: monospace;
            color:#fff;
          }
          #output {
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div id="output"></div>
        <script>
          (() => {
            const outputEl = document.getElementById('output');
            const logs = [];
            console.log = (...args) => {
              logs.push(args.join(' '));
              outputEl.textContent = logs.join('\\n');
            };
            try {
              ${code}
            } catch (e) {
              outputEl.textContent = '错误：【' + e.message + '】';
            }
          })();
        </script>
      </body>
      </html>
    `;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcdoc;
    }
  };
  // 组件卸载时清理iframe内容
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = '';
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full max-w-[1096px] flex-1">
      <div className="flex flex-col">
        <CodeMirror
          value={code}
          onChange={(value: string) => setCode(value)}
          extensions={[javascript({ jsx: true })]}
          theme='dark'
          maxWidth="100%"
          className="overflow-auto"
          height='550px'
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
        />
      </div>
      <div className="flex-1 mt-4 p-4 bg-gray-800 text-white rounded-lg flex-shrink-0">
        <h3 className="text-lg font-semibold mb-2">运行结果：</h3>
        <div className="whitespace-pre-wrap max-h-[150px] overflow-y-auto">
          {error && <div style={{ color: "salmon" }}>{error}</div>}
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            style={{
              width: "100%",
              height: 100,
            }}
            title="安全沙箱 iframe"
          />
        </div>
      </div>
    </div>
  );
}
