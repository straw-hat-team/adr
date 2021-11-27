import * as React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import clsx from 'clsx';

export function MultiColumnLayout(
  props: React.PropsWithChildren<{
    slots: {
      MainMenu: React.ComponentType;
      Header?: React.ComponentType<{
        onOpen(value: boolean): void;
      }>;
    };
  }>
) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen">
      <Transition.Root show={sidebarOpen} as={React.Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 lg:hidden" onClose={setSidebarOpen}>
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
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <props.slots.MainMenu />
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true" />
        </Dialog>
      </Transition.Root>

      <props.slots.MainMenu />

      <div className="flex flex-col flex-1">
        {props.slots.Header && <props.slots.Header onOpen={setSidebarOpen} />}
        <div className="flex-1 flex">{props.children}</div>
      </div>
    </div>
  );
}

export function Panel(
  props: React.PropsWithChildren<{
    as?: 'aside' | 'main';
    scrollable?: boolean;
    className?: string;
  }>
) {
  const Component = props.as ?? 'aside';
  return (
    <Component className={clsx('focus:outline-none relative', props.className)}>
      <div className="flex-1 flex absolute inset-0 top-0 overflow-y-auto">{props.children}</div>
    </Component>
  );
}
