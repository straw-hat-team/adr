import { PropsWithChildren } from 'react';

export function H2(props: PropsWithChildren<JSX.IntrinsicElements['h2']>) {
  return (
    <h2
      {...props}
      className="text-xl sm:text-3xl leading-none font-extrabold text-black dark:text-white tracking-tight mb-6 mt-10"
    />
  );
}
