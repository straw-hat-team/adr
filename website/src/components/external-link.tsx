import { ComponentProps } from 'react';
import clsx from 'clsx';
import { ExternalLinkIcon } from '@heroicons/react/outline';

type ExternalLinkProps = Exclude<ComponentProps<'a'>, 'target'>;

export function ExternalLink(props: ExternalLinkProps) {
  return (
    <a
      {...props}
      target="_blank"
      className={clsx(
        'rounded-sm hover:bg-blue-200 underline flex-inline justify-center text-blue-700 dark:text-blue-400',
        props.className
      )}
    >
      {props.children}
      <ExternalLinkIcon className="w-text w-text inline ml-1" role="img" aria-hidden="true" />
    </a>
  );
}
