import Document, { Html, Head, Main, NextScript } from 'next/document';

export class WebsiteDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        </Head>
        <body className="text-lg sm:text-2xl font-sans font-normal bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
