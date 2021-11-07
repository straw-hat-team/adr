import * as jsxRuntime from 'react/jsx-runtime';

export function getMDXModule(functionBodyCode: string, globals?: Record<string, any>) {
  const scope = { jsxRuntime, ...globals };
  const fn = new Function(...Object.keys(scope), functionBodyCode);
  return fn(...Object.values(scope));
}
