import * as React from 'react';
import { Transition, Dialog } from '@headlessui/react';

export function Drawer(
  props: React.PropsWithChildren<{
    title?: string;
    description?: string;
    open: boolean;
    onClose: () => void;
  }>
) {
  return (
    <Transition show={props.open} as={React.Fragment}>
      <Dialog unmount={false} onClose={props.onClose} className="fixed z-30 inset-0">
        <div className="flex h-screen">
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-in duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-30"
            entered="opacity-30"
            leave="transition-opacity ease-out duration-300"
            leaveFrom="opacity-30"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay
              className="z-40 fixed inset-0"
              style={{
                background: 'linear-gradient(75deg, rgba(22, 28, 36, 0.48) 0%, rgb(22, 28, 36) 100%)',
              }}
            />
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
            <div className="flex flex-col z-50 overflow-hidden">
              {props.title && <Dialog.Title className="sr-only">{props.title}</Dialog.Title>}
              {props.description && <Dialog.Description className="sr-only">{props.description}</Dialog.Description>}
              {props.children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
