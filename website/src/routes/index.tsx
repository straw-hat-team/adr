import NextLink from 'next/link';
import { ORGANIZATION_NAME, DISCUSSIONS_QA_URL, GENESIS_ADR } from '@/constants';
import { ArrowRightIcon } from '@heroicons/react/solid';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import { adrFormat } from '@/helpers';
import { Link } from '@/components/link';
import { PageTitle } from '@/components/page-title';

export function IndexRoute() {
  return (
    <>
      <PageTitle>Home</PageTitle>
      <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto flex flex-col gap-10 lg:gap-20">
        <header className="flex flex-col gap-8">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl leading-none font-extrabold text-black dark:text-white tracking-tight">
            Architecture Decision Record (ADR)
          </h1>
          <p>Is a design document providing high-level, concise documentation for software development.</p>
          <p>
            The goal is for these documents to serve as the source of truth for software-related documentation at{' '}
            {ORGANIZATION_NAME} and the means by which teams discuss and come to consensus on software development
            guidance.
          </p>
          <div className="flex flex-wrap space-y-4 sm:space-y-0 sm:space-x-4 text-center">
            <NextLink href="/adrs" passHref>
              <a className="text-center w-full sm:w-auto flex-none bg-gray-900 hover:bg-gray-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-700 text-lg leading-6 font-semibold py-6 px-12 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
                Explore the ADRs
              </a>
            </NextLink>
            <NextLink href={`/adrs/${GENESIS_ADR}`} passHref>
              <a className="text-center w-full sm:w-auto flex-none bg-gray-900 hover:bg-gray-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-700 text-lg leading-6 font-semibold py-6 px-12 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
                Learn how it works
              </a>
            </NextLink>
          </div>
        </header>
        <section className="grid gap-10 grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl sm:text-3xl leading-none font-extrabold text-black dark:text-white tracking-tight">
              Curious about the basics?
            </h2>
            <p>
              ADRs are a collection of guidance and a system we use to manage and track that guidance. Learn more about
              how the ADR works in the first ADR!
            </p>
            <NextLink href={`/adrs/${GENESIS_ADR}`} passHref>
              <a className="self-start inline-flex items-center text-gray-700 dark:text-gray-300 border-2 border-gray-700 hover:border-gray-500 text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
                READ {adrFormat(GENESIS_ADR)}
                <ArrowRightIcon className="w-text w-text ml-4" role="img" aria-hidden="true" />
              </a>
            </NextLink>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-xl sm:text-3xl leading-none font-extrabold text-black dark:text-white tracking-tight">
              Want to help?
            </h2>
            <p>
              Contribute by proposing new guidance, commenting on existing ADRs, or fixing typos. All contributions are
              welcome!
            </p>
            <NextLink href="/contributing" passHref>
              <a className="self-start inline-flex items-center text-gray-700 dark:text-gray-300 border-2 border-gray-700 hover:border-gray-500 text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
                Contribute to the project
                <ArrowRightIcon className="w-text w-text ml-4" role="img" aria-hidden="true" />
              </a>
            </NextLink>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-xl sm:text-3xl leading-none font-extrabold text-black dark:text-white tracking-tight">
              Still have questions?
            </h2>
            <p>
              Take a look at the&nbsp;
              <Link href="/faq">frequently asked questions</Link>. If you don't find an answer there, create a new
              discussion on our GitHub Discussions.
            </p>
            <a
              target="_blank"
              href={DISCUSSIONS_QA_URL}
              className="self-start inline-flex items-center text-gray-700 dark:text-gray-300 border-2 border-gray-700 hover:border-gray-500 text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200"
            >
              Ask us on Github
              <ExternalLinkIcon className="w-text w-text ml-4" role="img" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
