import { PropsWithChildren } from 'react';

export default function Button(props: PropsWithChildren<{}>) {
  return (
    <a
      target="_blank"
      href="https://bit.ly/3se7YYw"
      className="bg-purple-700 text-gray-200 rounded-lg border border-black-500 py-4 px-10 pointer font-normal shadow-md"
    >
      {props.children}
    </a>
  );
}
