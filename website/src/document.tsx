import Document, { Html, Head, Main, NextScript } from 'next/document';

export class WebsiteDocument extends Document {
  override render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
        </Head>
        <body className="h-full overflow-hidden text-lg sm:text-2xl font-sans font-normal bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
