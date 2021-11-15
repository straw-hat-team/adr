import Link from 'next/link';
import { adrFormat } from '@/helpers';
import { PATH_ADRS_SLUG } from '@/constants/routes';

type Adr = {
  slug: string;
};

export type AdrsProps = {
  adrs: Array<Adr>;
};

export function Adrs(props: AdrsProps) {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 lg:space-y-20 prose lg:prose-xl">
      <nav className="flex flex-col gap-4">
        {props.adrs.map((adr, index) => (
          <Link href={{ pathname: PATH_ADRS_SLUG, query: { slug: adr.slug } }} key={index}>
            {adrFormat(adr.slug)}
          </Link>
        ))}
      </nav>
    </main>
  );
}
