import * as jsxRuntime from 'react/jsx-runtime';

export function getMDXModule(functionBodyCode: string) {
  return new Function(functionBodyCode)(jsxRuntime);
}
