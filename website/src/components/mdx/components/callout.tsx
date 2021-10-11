import * as React from 'react';
import clsx from 'clsx';

const THEMES = {
  note: 'bg-orange-100 text-orange-800 dark:text-orange-300 dark:bg-orange-200 dark:bg-opacity-10',
  caution: 'bg-red-200 text-red-900 dark:text-red-200 dark:bg-red-600 dark:bg-opacity-30',
  warning: 'bg-yellow-200 text-yellow-900 dark:text-yellow-200 dark:bg-yellow-700 dark:bg-opacity-30',
};

type CalloutProps = React.PropsWithChildren<{
  type?: 'note' | 'caution' | 'warning';
  emoji?: string
}>;

export function Callout(props: CalloutProps) {
  const { type = 'note', emoji = '💡'} = props;
  return (
    <div className={clsx('flex rounded-lg callout mt-6', THEMES[type])}>
      <div
        className="pl-3 pr-2 py-2 select-none text-xl"
      >
        {emoji}
      </div>
      <div className="pr-4 py-2">{props.children}</div>
    </div>
  );
}
