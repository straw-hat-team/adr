import Link from 'next/link';

export function IndexRoute() {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-20 sm:space-y-32 md:space-y-40 lg:space-y-44">
      <header>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl leading-none font-extrabold text-black dark:text-white tracking-tight mb-8">
          Architecture Decision Record (ADR)
        </h1>
        <p className="max-w-4xl text-lg sm:text-2xl font-medium sm:leading-10 mb-6">
          Is a design document providing high-level, concise documentation for software development.
        </p>
        <div className="flex flex-wrap space-y-4 sm:space-y-0 sm:space-x-4 text-center">
          <Link href="/adrs" passHref>
            <a className="w-full sm:w-auto flex-none bg-gray-900 hover:bg-gray-700 text-white text-lg leading-6 font-semibold py-3 px-6 border border-transparent rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900 focus:outline-none transition-colors duration-200">
              Explore the ADRs
            </a>
          </Link>
        </div>
      </header>
    </main>
  );
}
