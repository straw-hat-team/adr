import * as React from 'react';
import type { AppProps, NextWebVitalsMetric } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { PAGE_TITLE_PREFIX } from '@/constants';
import { theme } from '@/helpers/mui-theme';
import { EmotionCacheAppProps } from '@/helpers/mui/core-nextjs';
import { useRouteChange } from '@/hooks/use-route-change';

export async function reportWebVitals(_metric: NextWebVitalsMetric) {
  // TODO: Send metrics to backends
}

export function App(props: AppProps<EmotionCacheAppProps>) {
  console.log('Have a great day! 📣🐢');
  console.log('Check this amazing material: https://bit.ly/3se7YYw');
  useRouteChange();

  return (
    <ThemeProvider attribute="class">
      <Head>
        <title>{PAGE_TITLE_PREFIX}</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <MuiThemeProvider theme={theme}>
        <props.Component {...props.pageProps} />
      </MuiThemeProvider>
    </ThemeProvider>
  );
}
