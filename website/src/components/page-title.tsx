import Head from 'next/head';
import { ORGANIZATION_NAME } from '@/constants';

type PageTitleProps = {
  suffix?: string;
  children: string;
};

export function PageTitle(props: PageTitleProps) {
  const suffix = props.suffix ?? ORGANIZATION_NAME;
  return (
    <Head>
      <title>
        {props.children} | {suffix}
      </title>
    </Head>
  );
}
