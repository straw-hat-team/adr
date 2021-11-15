import Link from 'next/link';
import { AdrMdxModuleExports } from '@/routes/adrs/types';
import { Badge } from '@/routes/adrs/components/badge';
import { routeAdrsAdr } from '@/helpers/routes';

export type AdrsProps = {
  adrs: Array<{
    slug: string;
    mdxExports: Pick<AdrMdxModuleExports, 'title' | 'frontmatter'>;
  }>;
};

export function Adrs(props: AdrsProps) {
  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto">
      <nav className="flex flex-col gap-6">
        {props.adrs.map((adr, index) => (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              {adr.mdxExports?.frontmatter?.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <Link href={routeAdrsAdr({ query: { slug: adr.slug } })} key={index} passHref>
              <a>{adr.mdxExports.title}</a>
            </Link>
          </div>
        ))}
      </nav>
    </main>
  );
}

export { Badge } from '@/routes/adrs/components/badge';
