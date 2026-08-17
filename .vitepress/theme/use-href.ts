import { useData, withBase } from 'vitepress';

export function useHref() {
  const { site } = useData();

  return function href(link: string) {
    if (site.value.cleanUrls || link.endsWith('/')) {
      return withBase(link);
    }

    return withBase(`${link}.html`);
  };
}
