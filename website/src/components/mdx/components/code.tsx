import * as React from 'react';
import clsx from 'clsx';

export function Code(props: React.PropsWithChildren<JSX.IntrinsicElements['code']>) {
  const isPrism = props.className?.includes('language-');
  return <code {...props} className={clsx('mb-4 rounded-sm px-2', !isPrism && 'bg-green-500')} />;
}
