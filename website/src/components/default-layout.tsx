import * as React from 'react';
import { Header } from '@/components/header';

type DefaultLayoutProps = React.PropsWithChildren<{}>;

export function DefaultLayout(props: DefaultLayoutProps) {
  return (
    <div className="flex flex-col gap-8">
      <Header />
      {props.children}
    </div>
  );
}
