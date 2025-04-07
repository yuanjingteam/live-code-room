// 'use client';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';
import { useEffect, useState } from 'react';

import { sendCodeSnippet } from '@/services/socketService';

import { evalCode } from '../../lib/tool';

interface State {
  code: string;
  codeComponent: any;
}

const CodeMirrorComponent = (props: object) => {
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
    sendCodeSnippet({ code });
  }, [code]);

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
};

export default CodeMirrorComponent;
