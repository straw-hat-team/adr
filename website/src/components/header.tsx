import * as React from 'react';
import NextLink from 'next/link';

import { ThemeToggler } from '@/components/theme-toggler';

type NavLinkProps = React.PropsWithChildren<{
  href: string;
}>;

function NavLink(props: NavLinkProps) {
  return (
    <NextLink href={props.href} passHref>
      <a className="p-4 text-gray-900 dark:text-gray-100">{props.children}</a>
    </NextLink>
  );
}

export function Header2() {
  return (
    <header className="shadow-sm backdrop-filter backdrop-blur-lg backdrop-saturate-150 bg-white dark:bg-gray-800 bg-opacity-80">
      <div className="flex items-center justify-between w-full max-w-screen-lg xl:max-w-screen-xl py-8 px-4 mx-auto text-gray-900 dark:text-gray-100">
        <nav className="flex text-center">
          <NavLink href="/">
            <span className="block">🏡</span>Home
          </NavLink>
          <NavLink href="/adrs">
            <span className="block">📝</span>ADRs
          </NavLink>
          <NavLink href="/contributing">
            <span className="block">👩🏻‍💻</span>Contributing
          </NavLink>
          <NavLink href="/faq">
            <span className="block">❓</span> FAQ
          </NavLink>
        </nav>
        <ThemeToggler />
      </div>
    </header>
  );
}
