import { PropsWithChildren } from 'react';

export function P(props: PropsWithChildren<JSX.IntrinsicElements['p']>) {
  return <p {...props} className="mb-4" />;
}
