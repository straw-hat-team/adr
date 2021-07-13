import Link from 'next/link';
import { LinkIcon } from '@heroicons/react/outline';

type LinkSelfProps = {
  anchor: string;
};

export function LinkSelf(props: LinkSelfProps) {
  return (
    <Link href={`#${props.anchor}`} passHref>
      <a className="inline-flex justify-center items-center p-2 rounded-full bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:cursor">
        <LinkIcon className="w-text h-text inline" />
      </a>
    </Link>
  );
}
