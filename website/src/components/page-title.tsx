import Head from 'next/head';
import { PAGE_TITLE_PREFIX } from '@/constants';

type PageTitleProps = {
  suffix?: string;
  children: string;
};

export function PageTitle(props: PageTitleProps) {
  const suffix = props.suffix ?? PAGE_TITLE_PREFIX;

  return (
    <Head>
      <title>
        {props.children} - {suffix}
      </title>
    </Head>
  );
}
