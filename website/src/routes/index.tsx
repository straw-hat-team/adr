import Link from 'next/link';
import { COMPANY_NAME } from '@/constants';

export function IndexRoute() {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 md:space-y-40 lg:space-y-44">
      <header>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl leading-none font-extrabold text-black dark:text-white tracking-tight mb-8">
          Architecture Decision Record (ADR)
        </h1>
        <p className="text-lg sm:text-2xl font-medium sm:leading-10 mb-10">
          Is a design document providing high-level, concise documentation for software development.
        </p>
        <p className="text-lg sm:text-2xl sm:leading-10 mb-10">
          The goal is for these documents to serve as the source of truth for software-related documentation at{' '}
          {COMPANY_NAME} and the way teams discuss and come to consensus on software development guidance.
        </p>
        <div className="flex flex-wrap space-y-4 sm:space-y-0 sm:space-x-4 text-center">
          <Link href="/adrs" passHref>
            <a className="w-full sm:w-auto flex-none bg-gray-900 hover:bg-gray-700 text-white text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
              Explore the ADRs
            </a>
          </Link>
          <Link href="/adrs" passHref>
            <a className="w-full sm:w-auto flex-none bg-gray-900 hover:bg-gray-700 text-white text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
              Learn how it works
            </a>
          </Link>
        </div>
      </header>
    </main>
  );
}
