import React, { ComponentProps } from 'react';
import clsx from 'clsx';

type LinkProps = Exclude<ComponentProps<'a'>, 'href'>;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  return (
    <a
      {...props}
      ref={ref}
      className={clsx('hover:underline flex-inline justify-center text-blue-700 dark:text-blue-400', props.className)}
    >
      {props.children}
    </a>
  );
});
