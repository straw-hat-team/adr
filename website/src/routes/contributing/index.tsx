import { useMdxModule } from '@/hooks/use-mdx-module';

export type ContributingProps = {
  post: string;
};

export function Contributing(props: ContributingProps) {
  const Module = useMdxModule({ source: props.post });

  return (
    <main className="px-4 max-w-screen-lg xl:max-w-screen-xl mx-auto space-y-10 lg:space-y-20 prose lg:prose-xl">
      <Module.default />
    </main>
  );
}
