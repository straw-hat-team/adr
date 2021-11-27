import {
  CalendarIcon,
  HomeIcon,
  MapIcon,
  MenuIcon,
  SearchCircleIcon,
  SpeakerphoneIcon,
  UserGroupIcon,
} from '@heroicons/react/outline';
import clsx from 'clsx';
import * as React from 'react';

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
  { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
  { name: 'Teams', href: '#', icon: UserGroupIcon, current: false },
  { name: 'Directory', href: '#', icon: SearchCircleIcon, current: false },
  { name: 'Announcements', href: '#', icon: SpeakerphoneIcon, current: false },
  { name: 'Office Map', href: '#', icon: MapIcon, current: false },
];

const longNavigation = [...navigation, ...navigation, ...navigation, ...navigation, ...navigation];

export function MainMenuSideBar() {
  return (
    <div className="flex-1 justify-between flex flex-col pt-5 pb-4 border-r border-gray-200 bg-gray-100 overflow-y-auto shadow-lg gap-5 flex-nowrap">
      <div className="px-4 bg-blue-200">
        <img
          className="h-8"
          src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-900-text.svg"
          alt="Workflow"
        />
      </div>
      <nav className="bg-yellow-700 flex-grow flex flex-col gap-1 overflow-scroll">
        {navigation.concat(longNavigation).map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={clsx(
              item.current ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-10 py-2 text-sm font-medium rounded-md'
            )}
          >
            <item.icon
              className={clsx(
                item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-6 w-6'
              )}
              aria-hidden="true"
            />
            {item.name}
          </a>
        ))}
      </nav>
      <div className="bg-blue-700 px-4">
        <img
          className="h-8"
          src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-900-text.svg"
          alt="Workflow"
        />
      </div>
    </div>
  );
}

// background: linear-gradient(
//   75deg, rgba(22, 28, 36, 0.48) 0%, rgb(22, 28, 36) 100%);

export function Header(props: { onOpen: (value: boolean) => void }) {
  return (
    <header className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-1.5">
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
