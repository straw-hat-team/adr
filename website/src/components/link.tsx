import React, { ComponentProps } from 'react';
import clsx from 'clsx';

type LinkProps = Exclude<ComponentProps<'a'>, 'href'>;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  return (
    <a
      {...props}
      ref={ref}
      className={clsx(
        'underline rounded-sm hover:bg-blue-200 flex-inline justify-center text-blue-700 dark:text-blue-400',
        props.className
      )}
    >
      {props.children}
    </a>
  );
});
