import { ExternalLink } from '@/components/external-link';
import { Link } from '@/components/link';
import { RouterLink } from '@/components/router-link';

export function LegalFooter() {
  return (
    <footer className="text-gray-500 dark:text-gray-400 text-sm max-w-screen-lg xl:max-w-screen-xl py-8 px-4 mx-auto my-0 text-gray-900 md:my-8 dark:text-gray-100">
      Except as otherwise noted, the content of this page is licensed under the&nbsp;
      <ExternalLink href="https://creativecommons.org/licenses/by/4.0/">
        Creative Commons Attribution 4.0 License
      </ExternalLink>
      , and code samples are licensed under the&nbsp;
      <ExternalLink href="https://opensource.org/licenses/MIT">MIT</ExternalLink>. For details, see&nbsp;
      <RouterLink href="/licensing" passHref>
        <Link>content licensing</Link>
      </RouterLink>
      .
    </footer>
  );
}
