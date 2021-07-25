import { Header } from '@/components/header';
import { LegalFooter } from '@/components/legal-footer';
import * as React from 'react';

type DefaultLayoutProps = React.PropsWithChildren<{}>;

export function DefaultLayout(props: DefaultLayoutProps) {
  return (
    <>
      <Header />
      {props.children}
      <LegalFooter />
    </>
  );
}
