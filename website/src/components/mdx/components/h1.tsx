import { PropsWithChildren } from 'react';

export function H1(props: PropsWithChildren<JSX.IntrinsicElements['h1']>) {
  return (
    <h1
      {...props}
      className="text-3xl sm:text-5xl lg:text-6xl leading-none font-extrabold text-black dark:text-white tracking-tight mb-6 mt-10"
    />
  );
}
