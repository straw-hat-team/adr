import {
  HomeIcon,
  MenuIcon,
  UserGroupIcon,
  XIcon,
  QuestionMarkCircleIcon,
  NewspaperIcon,
} from '@heroicons/react/outline';
import clsx from 'clsx';
import * as React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Image } from '@/components/image';
import { RouterLink } from '@/components/router-link';
import { useRouter } from 'next/router';
import { PATH_ADRS, PATH_CONTRIBUTING, PATH_FAQ, PATH_INDEX } from '@/constants/routes';

const navigation = [
  { name: 'Home', href: PATH_INDEX, icon: HomeIcon },
  { name: 'ADRs', href: PATH_ADRS, icon: NewspaperIcon },
  { name: 'Contributing', href: PATH_CONTRIBUTING, icon: UserGroupIcon },
  { name: 'FAQ', href: PATH_FAQ, icon: QuestionMarkCircleIcon },
];

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
        {navigation.concat().map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={clsx(
              router.asPath === item.href
                ? 'bg-green-200 bg-opacity-20 text-green-700 font-semibold relative before:absolute before:top-0 before:bottom-0 before:right-0 before:rounded-tl before:rounded-bl before:bg-green-700 before:w-1'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-normal',
              'group flex items-center pl-12 pr-4  py-4 text-sm'
            )}
          >
            <item.icon
              className={clsx(
                router.asPath === item.href ? 'text-green-700' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-6 w-6'
              )}
              aria-hidden="true"
            />
            {item.name}
          </a>
        ))}
      </nav>
      <RouterLink href="/" passHref>
        <a className="px-4 py-4 border-t border-gray-200">
          <Image
            layout="fill"
            className="h-8 w-auto"
            src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-900-text.svg"
            alt="Workflow"
          />
        </a>
      </RouterLink>
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

export function Drawer(
  props: React.PropsWithChildren<{
    show: boolean;
    onClose: (value: ((prevState: boolean) => boolean) | boolean) => void;
    onOpen: () => void;
  }>
) {
  return (
    <Transition.Root show={props.show} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 flex z-40 lg:hidden" onClose={props.onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gradient-to-bl from-gray-900 bg-gray-800 bg-opacity-50" />
        </Transition.Child>

        <Transition.Child
          as={React.Fragment}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="relative flex flex-col bg-white focus:outline-none">
            <Transition.Child
              as={React.Fragment}
              enter="ease-in-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="absolute top-0 right-0 transform translate-x-full pt-2 pl-2">
                <button
                  type="button"
                  className="flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={props.onOpen}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
            </Transition.Child>
            {props.children}
          </div>
        </Transition.Child>
        <div className="flex-shrink-0 w-14" aria-hidden="true" />
      </Dialog>
    </Transition.Root>
  );
}
