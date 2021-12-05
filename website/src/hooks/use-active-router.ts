import { useRouter } from 'next/router';

export function useActiveRouter(props: { href: string }) {
  const router = useRouter();
  return router.asPath === props.href;
}
