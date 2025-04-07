import { transform } from '@babel/standalone';

interface ModuleMap {
  [key: string]: any;
}

const _require = (moduleName: string): any => {
  const modeules: ModuleMap = {
    react: require('react'),
    'react-dom': require('react'),
  };
  if (modeules[moduleName]) {
    return modeules[moduleName];
  }
  throw new Error(
    `找不到'${moduleName}模块'，可选模块有：${Object.keys(modeules).join(', ')}`,
  );
};

export const evalCode = (code: string): any => {
  const output = transform(code, { presets: ['es2015', 'react'] }).code;
  const fn = new Function(
    `var require = arguments[0], exports = arguments[1];\n ${output}`,
  );
  const exports = {};
  fn.call(null, _require, exports);
  console.log(exports, 'exports');

  return exports.default;
};
