import { PropsWithChildren } from 'react';

export function H3(props: PropsWithChildren<JSX.IntrinsicElements['h3']>) {
  return (
    <h2
      {...props}
      className="text-lg sm:text-xl leading-none font-extrabold text-black dark:text-white tracking-tight my-6"
    />
  );
}
