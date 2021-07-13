import { PropsWithChildren } from 'react';
import NextLink from 'next/link';

import { ThemeToggler } from '@/components/theme-toggler';

function NavLink(
  props: PropsWithChildren<{
    href: string;
  }>
) {
  return (
    <NextLink href={props.href} passHref>
      <a  className="p-1 text-gray-900 sm:p-4 dark:text-gray-100">
        {props.children}
      </a>
    </NextLink>

  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl backdrop-saturate-150 bg-white dark:bg-black bg-opacity-60">
      <nav className="flex items-center justify-between w-full max-w-4xl p-8 mx-auto my-0 text-gray-900 md:my-8 dark:text-gray-100">
        <div>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/adrs">ADRs</NavLink>
          <NavLink href="/faq">FAQ</NavLink>
          <NavLink href="/contributing">Contributing</NavLink>
        </div>
        <ThemeToggler />
      </nav>
    </header>
  );
}
