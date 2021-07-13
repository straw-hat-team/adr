import Document, { Html, Head, Main, NextScript } from 'next/document';

export class WebsiteDocument extends Document {
  render() {
    return (
      <Html>
        <Head></Head>
        <body>
        <Main />
        <NextScript />
        </body>
      </Html>
    );
  }
}
