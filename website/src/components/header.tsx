import { PropsWithChildren } from 'react';
import NextLink from 'next/link';

import { ThemeToggler } from '@/components/theme-toggler';

type NavLinkProps = PropsWithChildren<{
  href: string;
}>;

function NavLink(props: NavLinkProps) {
  return (
    <NextLink href={props.href} passHref>
      <a className="p-4 text-gray-900 dark:text-gray-100">{props.children}</a>
    </NextLink>
  );
}

export function Header() {
  return (
    <header className="mb-8 shadow-sm sticky top-0 z-10 backdrop-filter backdrop-blur-lg backdrop-saturate-150 bg-white dark:bg-gray-800 bg-opacity-80">
      <div className="flex items-center justify-between w-full max-w-screen-lg xl:max-w-screen-xl py-8 px-4 mx-auto text-gray-900 dark:text-gray-100">
        <nav>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/adrs">ADRs</NavLink>
          <NavLink href="/contributing">Contributing</NavLink>
          <NavLink href="/faq">FAQ</NavLink>
        </nav>
        <ThemeToggler />
      </div>
    </header>
  );
}
