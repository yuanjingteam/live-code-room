'use client';

import { useEffect, useRef, useState } from 'react';

interface CodeSandboxProps {
  code: string;
  onResult: (result: string) => void;
}

const SANDBOX_PERMISSIONS = [
  'allow-scripts',
  'allow-same-origin',
  'allow-modals'
].join(' ');

const CodeSandbox = ({ code, onResult }: CodeSandboxProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState('');

  const sanitizeCode = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 移除危险元素
    ['link', 'meta', 'iframe', 'frame', 'script'].forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    return doc.documentElement.outerHTML;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      // 创建安全沙箱
      const sandboxId = `sandbox-${Math.random().toString(36).slice(2, 11)}`;
      const sanitized = sanitizeCode(code);

      const blob = new Blob([`
        <html>
          <body>
            <div id="root"></div>
            <script>
              (function() {
                const originLog = console.log;
                console.log = (...args) => {
                  window.parent.postMessage({
                    type: 'log',
                    sandboxId: '${sandboxId}',
                    data: args.join(' ')
                  }, '*');
                  originLog(...args);
                };

                try {
                  ${sanitized.includes('<script>') ?
          sanitized.match(/<script>([\s\S]*?)<\/script>/)?.[1] || ''
          : ''}
                } catch(e) {
                  window.parent.postMessage({
                    type: 'error',
                    sandboxId: '${sandboxId}',
                    data: e.message
                  }, '*');
                }
              })();
            </script>
          </body>
        </html>
      `], { type: 'text/html' });

      iframe.src = URL.createObjectURL(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : '代码执行失败');
    }

    return () => {
      URL.revokeObjectURL(iframe.src);
    };
  }, [code]);

  return (
    <div className="sandbox-container">
      {error && <div className="error-message">{error}</div>}
      <iframe
        ref={iframeRef}
        sandbox={SANDBOX_PERMISSIONS}
        className="w-full h-64 border rounded"
      />
    </div>
  );
};

export default CodeSandbox;