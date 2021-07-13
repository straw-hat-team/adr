import * as React from 'react';
import type { AppProps, NextWebVitalsMetric } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import { Header } from "@/components/header";

export async function reportWebVitals(_metric: NextWebVitalsMetric) {
  // TODO: Send metrics to backends
}

export function App(props: AppProps) {
  console.log('Have a great day! 📣🐢');
  console.log('Check this amazing material: https://bit.ly/3se7YYw');

  return (
    <ThemeProvider attribute="class">
      <Head>
        <title>Website</title>
      </Head>
      <Header/>
      <props.Component {...props.pageProps} />
    </ThemeProvider>
  );
}
