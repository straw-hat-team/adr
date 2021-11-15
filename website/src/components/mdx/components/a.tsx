import { PropsWithChildren } from 'react';
import { adrFormat, adrFromHref } from '@/helpers';
import NextLink from 'next/link';
import { Link } from '@/components/link';
import { PATH_ADRS_SLUG } from '@/constants/routes';
import { REGEX_HTTPS_HOST } from '@/constants';
import { ExternalLink } from '@/components/external-link';

export function A(props: PropsWithChildren<JSX.IntrinsicElements['a']>) {
  const adr = adrFromHref(props.href);

  console.log(props.href);

  if (adr) {
    return (
      <NextLink href={{ pathname: PATH_ADRS_SLUG, query: { slug: adr } }} passHref>
        <Link>{adrFormat(adr)}</Link>
      </NextLink>
    );
  }

  if (REGEX_HTTPS_HOST.test(props.href!)) {
    return <ExternalLink {...props} />;
  }

  return <a {...props} className="hover:underline flex-inline justify-center text-blue-700 dark:text-blue-400" />;
}
