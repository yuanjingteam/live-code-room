'use client';

import { useState, useCallback } from 'react';

const DANGEROUS_PATTERNS = [
  /eval\(/i,
  /Function\(/i,
  /localStorage/i,
  /XMLHttpRequest/i,
  /fetch\(/i,
  /importScripts\(/i
];

export const useCodeProcessor = () => {
  const [executionTime, setExecutionTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState('');

  const analyzeCode = useCallback((code: string) => {
    const warnings = DANGEROUS_PATTERNS
      .filter(pattern => pattern.test(code))
      .map(() => '检测到潜在危险代码');

    setAnalysisResult(warnings.join('\n'));
    return warnings.length > 0;
  }, []);

  const formatCode = useCallback((code: string) => {
    return code
      .replace(/\s+/g, ' ')
      .replace(/<\/?(\w+)/g, '\n<$1')
      .trim();
  }, []);

  return {
    analyzeCode,
    formatCode,
    executionTime,
    analysisResult,
    setExecutionTime
  };
};