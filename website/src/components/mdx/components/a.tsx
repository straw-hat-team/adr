import { PropsWithChildren } from 'react';
import { adrFormat, adrFromHref } from '@/helpers';
import NextLink from 'next/link';
import { Link } from '@/components/link';
import { REGEX_HTTPS_HOST } from '@/constants';
import { ExternalLink } from '@/components/external-link';
import { routeAdrsAdr } from '@/helpers/routes';

export function A(props: PropsWithChildren<JSX.IntrinsicElements['a']>) {
  const adr = adrFromHref(props.href);

  if (adr) {
    return (
      <NextLink href={routeAdrsAdr({ query: { slug: adr } })} passHref>
        <Link>{adrFormat(adr)}</Link>
      </NextLink>
    );
  }

  if (REGEX_HTTPS_HOST.test(props.href!)) {
    return <ExternalLink {...props} />;
  }

  return <a {...props} className="hover:underline flex-inline justify-center text-blue-700 dark:text-blue-400" />;
}
