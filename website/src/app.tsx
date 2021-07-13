import * as React from "react";
import { AppProps } from "next/app";
import Head from "next/head";

export function App(props: AppProps) {
  console.log("Have a great day! 📣🐢");
  console.log("Check this amazing material: https://bit.ly/3se7YYw");

  return (
    <React.Fragment>
      <Head>
        <title>Website</title>
      </Head>
      <props.Component {...props.pageProps} />
    </React.Fragment>
  );
}
