import {
  CalendarIcon,
  HomeIcon,
  MapIcon,
  MenuIcon,
  SearchCircleIcon,
  SpeakerphoneIcon,
  UserGroupIcon,
  XIcon,
} from '@heroicons/react/outline';
import clsx from 'clsx';
import * as React from 'react';
import { Dialog, Transition } from '@headlessui/react';

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
  { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
  { name: 'Teams', href: '#', icon: UserGroupIcon, current: false },
  { name: 'Directory', href: '#', icon: SearchCircleIcon, current: false },
  { name: 'Announcements', href: '#', icon: SpeakerphoneIcon, current: false },
  { name: 'Office Map', href: '#', icon: MapIcon, current: false },
];

export function MainMenuSideBar(props: { className?: string }) {
  return (
    <div
      className={clsx(
        'flex-shrink-0 justify-between flex flex-col border-r border-gray-200 bg-white overflow-y-auto flex-nowrap',
        props.className
      )}
    >
      <div className="px-4 py-4 border-b border-gray-200">
        <img
          className="h-8 w-auto"
          src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-900-text.svg"
          alt="Workflow"
        />
      </div>
      <nav className="flex-grow flex flex-col gap-1 overflow-scroll w-72">
        {navigation.concat([]).map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={clsx(
              item.current
                ? 'bg-green-100 text-green-700 font-semibold bg-opacity-40'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-normal',
              'group flex items-center pl-12 pr-4  py-4 text-sm'
            )}
          >
            <item.icon
              className={clsx(
                item.current ? 'text-green-700' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-6 w-6'
              )}
              aria-hidden="true"
            />
            {item.name}
          </a>
        ))}
      </nav>
    </div>
  );
}

// background: linear-gradient(
//   75deg, rgba(22, 28, 36, 0.48) 0%, rgb(22, 28, 36) 100%);

export function Header(props: { onOpen: (value: boolean) => void }) {
  return (
    <header className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div>
        <img
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
