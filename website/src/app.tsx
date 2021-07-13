import * as React from 'react';
import type { AppProps, NextWebVitalsMetric } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import { Header } from '@/components/header';
import { LegalFooter } from '@/components/legal-footer';
import { MDXProvider } from '@mdx-js/react';
import { COMPONENTS } from '@/components/mdx';

export async function reportWebVitals(_metric: NextWebVitalsMetric) {
  // TODO: Send metrics to backends
}

export function App(props: AppProps) {
  console.log('Have a great day! 📣🐢');
  console.log('Check this amazing material: https://bit.ly/3se7YYw');

  return (
    <MDXProvider components={COMPONENTS}>
      <ThemeProvider attribute="class">
        <Head>
          <title>Website</title>
        </Head>
        <Header />
        <props.Component {...props.pageProps} />
        <LegalFooter />
      </ThemeProvider>
    </MDXProvider>
  );
}
