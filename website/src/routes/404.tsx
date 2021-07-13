import Head from 'next/head';
import NextLink from 'next/link';

export function NotFound() {
  return (
    <>
      <Head>
        <title>404</title>
      </Head>
      <div className="space-y-8 px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto flex flex-col justify-center items-start mb-16">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight text-black dark:text-white">
          404 – Page Not Found
        </h1>
        <p>Sorry, we can't find the page you were looking for.</p>
        <NextLink href="/" passHref>
          <a className="text-center w-full sm:w-auto flex-none bg-gray-900 hover:bg-gray-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-700 text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
            Return Home
          </a>
        </NextLink>
      </div>
    </>
  );
}
