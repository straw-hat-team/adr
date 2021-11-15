import { PropsWithChildren } from 'react';
import clsx from 'clsx';

const COLORS: Record<string, string> = {
  MUST: 'text-red-500',
  'MUST NOT': 'text-red-500',
  MAY: 'text-green-700',
  SHOULD: 'text-yellow-500',
  'SHOULD NOT': 'text-yellow-500',
};

export function Strong(props: PropsWithChildren<JSX.IntrinsicElements['strong']>) {
  return <strong {...props} className={clsx(COLORS[props.children as string])} />;
}
