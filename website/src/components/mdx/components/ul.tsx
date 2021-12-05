import { PropsWithChildren } from 'react';

export function Ul(props: PropsWithChildren<JSX.IntrinsicElements['ul']>) {
  return <ul {...props} className="mb-4" />;
}
