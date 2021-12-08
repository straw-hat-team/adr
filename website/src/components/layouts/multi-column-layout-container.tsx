import * as React from 'react';
import { PATH_ADRS, PATH_CONTRIBUTING, PATH_FAQ, PATH_INDEX } from '@/constants/routes';
import {
  AdjustmentsIcon,
  HomeIcon,
  MenuIcon,
  NewspaperIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/outline';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { RouterLink } from '@/components/router-link';
import { Image } from '@/components/image';
import MuiDrawer from '@mui/material/Drawer';

const NAVIGATION = [
  { name: 'Home', href: PATH_INDEX, icon: HomeIcon },
  { name: 'ADRs', href: PATH_ADRS, icon: NewspaperIcon },
  { name: 'Contributing', href: PATH_CONTRIBUTING, icon: UserGroupIcon },
  { name: 'FAQ', href: PATH_FAQ, icon: QuestionMarkCircleIcon },
];

export function DefaultMultiColumnLayout(props: React.PropsWithChildren<{}>) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <MultiColumnLayoutContainer>
      <MuiDrawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <MainMenuSideBar className="flex-1" />
      </MuiDrawer>
      <MainMenuSideBar className="hidden lg:flex" />
      <div className="flex flex-col flex-1">
        <Header onOpen={() => setSidebarOpen(true)} />
        <div className="flex-1 flex overflow-hidden">{props.children}</div>
      </div>
    </MultiColumnLayoutContainer>
  );
}

export function MultiColumnLayoutContainer(props: React.PropsWithChildren<{}>) {
  return <div className="flex h-screen">{props.children}</div>;
}

export function MainMenuSideBar(props: { className?: string }) {
  const router = useRouter();

  return (
    <div
      className={clsx(
        'flex-shrink-0 justify-between flex flex-col border-r border-gray-200 bg-white overflow-y-auto flex-nowrap',
        props.className
      )}
    >
      <RouterLink href="/" passHref>
        <a className="px-4 py-4 border-b border-gray-200">
          <Image
            layout="fill"
            className="h-8 w-auto"
            src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-900-text.svg"
            alt="Workflow"
          />
        </a>
      </RouterLink>
      <nav className="flex-grow flex flex-col gap-1 overflow-scroll w-72">
        {NAVIGATION.concat().map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={clsx(
              router.asPath === item.href
                ? 'bg-green-200 bg-opacity-20 text-green-700 font-semibold relative before:absolute before:top-0 before:bottom-0 before:right-0 before:rounded-tl before:rounded-bl before:bg-green-700 before:w-1'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-normal',
              'group flex items-center pl-12 pr-4 py-4 text-sm flex gap-3'
            )}
          >
            <item.icon
              className={clsx(
                router.asPath === item.href ? 'text-green-700' : 'text-gray-400 group-hover:text-gray-500',
                'h-6 w-6'
              )}
              aria-hidden="true"
            />
            {item.name}
          </a>
        ))}
      </nav>
      <button className="group flex gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-normal flex items-center pl-12 pr-4  py-4 text-sm">
        <AdjustmentsIcon className="text-gray-400 group-hover:text-gray-500 h-6 w-6" aria-hidden="true" />
        Settings
      </button>
    </div>
  );
}

// TODO: fix modal backdrop background
// background: linear-gradient(
//   75deg, rgba(22, 28, 36, 0.48) 0%, rgb(22, 28, 36) 100%);

export function Header(props: { onOpen: (value: boolean) => void }) {
  return (
    <header className="flex lg:hidden items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
      <div>
        <Image
          layout="fill"
          className="h-8 w-auto"
          src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
          alt="Workflow"
        />
      </div>
      <div>
        <button
          type="button"
          className="-mr-3 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
          onClick={() => props.onOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <MenuIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
